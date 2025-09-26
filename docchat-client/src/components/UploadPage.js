import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import mammoth from "mammoth";

export default function UploadPage({ onUpload }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    const type = selectedFile.type;
    if (type === "application/pdf") {
      setPreviewContent(URL.createObjectURL(selectedFile));
    } else if (type === "text/plain") {
      const text = await selectedFile.text();
      setPreviewContent(text);
    } else if (
      type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      selectedFile.name.endsWith(".docx")
    ) {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      setPreviewContent(result.value);
    } else if (
      type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      selectedFile.name.endsWith(".xlsx") ||
      selectedFile.name.endsWith(".xls")
    ) {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const sheetText = XLSX.utils.sheet_to_html(worksheet);
      setPreviewContent(sheetText);
    } else {
      setPreviewContent(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:8080/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUpload({
        file,
        url: res.data.url,
        key: res.data.key,
      });
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. See console.");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (file && file.type === "application/pdf") {
        URL.revokeObjectURL(previewContent);
      }
    };
  }, [file, previewContent]);

  const isPreviewFile =
    previewContent &&
    (file?.type === "application/pdf" ||
      file?.type === "text/plain" ||
      file?.name.endsWith(".docx") ||
      file?.name.endsWith(".xlsx") ||
      file?.name.endsWith(".xls"));

  return (
    <div
      className="upload-container"
      style={{
        display: "flex",
        flexDirection: "row",
        height: "100%",
      }}
    >
      {/* Left side: Upload controls */}
      <div className="upload-controls">
        <h1>DocChat</h1>
        <p className="subtitle">Upload your document to get started</p>
        <label className="upload-box">
          <input
            type="file"
            accept=".doc,.docx,.pdf,.txt,.xls,.xlsx"
            onChange={handleFileChange}
          />
          <span>📂 Click or drag file here</span>
        </label>

        <button
          className="upload-button"
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {/* Right side: Preview */}
      {isPreviewFile && (
        <div className="preview-container">
          {file.type === "application/pdf" ? (
            <iframe
              src={previewContent}
              title="PDF Preview"
              className="pdf-preview"
            />
          ) : file.type === "text/plain" || file.name.endsWith(".docx") ? (
            <div className="doc-preview">{previewContent}</div>
          ) : (
            <div
              dangerouslySetInnerHTML={{ __html: previewContent }}
              className="doc-preview"
            />
          )}
        </div>
      )}
    </div>
  );
}
