import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios"; // for Ollama API requests
import pdfParse from "pdf-parse-fixed";
import mammoth from "mammoth";
import XLSX from "xlsx";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); // needed to parse JSON bodies

// S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const upload = multer({ storage: multer.memoryStorage() });

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Upload API
app.post("/upload", upload.single("file"), async (req, res) => {
  const key = `${Date.now()}-${req.file.originalname}`;
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  };

  try {
    await s3.send(new PutObjectCommand(params));
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
      { expiresIn: 300 }
    );
    res.json({ url, key });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch doc (signed URL)
app.get("/documents/:key", async (req, res) => {
  try {
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: req.params.key,
      }),
      { expiresIn: 300 } // 5 minutes
    );
    res.json({ url });
  } catch (err) {
    console.error("Signed URL error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ============== Extract Document Text ============== */
app.get("/documents/:key/text", async (req, res) => {
  try {
    const key = req.params.key;
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
    });
    const s3Object = await s3.send(command);

    // Convert S3 stream to buffer
    const chunks = [];
    for await (const chunk of s3Object.Body) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);

    // Detect file type
    const ext = key.split(".").pop().toLowerCase();
    let text = "";

    if (ext === "txt") {
      text = fileBuffer.toString("utf-8");
    } else if (ext === "pdf") {
      const pdfData = await pdfParse(fileBuffer);
      text = pdfData.text;
    } else if (ext === "docx") {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      text = result.value;
    } else if (ext === "xlsx") {
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const sheetNames = workbook.SheetNames;
      text = sheetNames
        .map((name) => XLSX.utils.sheet_to_csv(workbook.Sheets[name]))
        .join("\n");
    } else {
      return res.status(400).json({ error: "Unsupported file type" });
    }

    res.json({ text });
  } catch (err) {
    console.error("Error extracting text:", err);
    res.status(500).json({ error: "Failed to extract document text" });
  }
});

/* ================= Ollama Chat Endpoint ================= */
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body; // messages = [{role, content}, ...]

  if (!messages) {
    return res.status(400).json({ error: "Messages are required" });
  }

  try {
    const OLLAMA_API_URL = "http://localhost:11434/api/chat";

    const response = await axios.post(
      OLLAMA_API_URL,
      { model: "llama2", messages },
      { responseType: "stream" } // stream response
    );

    let fullText = "";

    response.data.on("data", (chunk) => {
      const lines = chunk
        .toString()
        .split("\n")
        .filter((l) => l.trim() !== "");

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.message && json.message.content) {
            fullText += json.message.content;
          }
        } catch (err) {
          console.error("Failed to parse line:", line);
        }
      }
    });

    response.data.on("end", () => {
      res.json({ reply: fullText });
    });
  } catch (err) {
    console.error("Ollama chat error:", err);
    res.status(500).json({ error: "Failed to communicate with Ollama" });
  }
});

app.listen(8080, () => console.log("Server running on http://localhost:8080"));
