# DocChat

DocChat is a local document processing and AI-assisted chat platform that allows users to upload documents, extract text, and interact with a local AI chatbot using Ollama LLM. The system preserves formatting and provides a smooth chat and document workflow.

---

## Features

- Upload documents (`.txt`, `.pdf`, `.docx`, `.xlsx`) to local S3 storage.
- Extract text from uploaded documents while preserving formatting.
- Chat with a local AI model (Ollama LLM) to summarize or answer questions about the document.
- Fully local AI processing with Ollama; no cloud AI calls are required.

---

## Tech Stack

- **Frontend:** React
  - Handles file uploads, chat interface, and document previews.
  - Uses `axios` for HTTP requests to the Node backend.
- **Backend:** Node.js + Express
  - REST API for uploading, fetching, and processing documents.
  - Integrates with local S3 (AWS SDK) for document storage and retrieval.
  - Integrates with **Ollama LLM** for AI-based chat.
- **Document Parsing Libraries:**
  - `pdf-parse-fixed` for PDFs
  - `mammoth` for DOCX
  - `xlsx` for Excel
- **Local AI Model:** Ollama LLM (`llama2`) running locally at `http://localhost:11434`.
- **Storage:** AWS S3 (or localstack for testing) for document storage.

---

## Prerequisites

- Node.js (v18+)
- npm or yarn
- AWS account or local S3 setup
- Ollama installed locally and running (`llama2` model)
- React development environment

---

Backend Setup (Node.js + Express)
cd server
npm install

Environment Variables

Create a .env file in the server folder:

AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET=your-s3-bucket-name
PORT=8080

Run the Server
node server.js

Health check: http://localhost:8080/health

Upload API: POST http://localhost:8080/upload

Extract text: GET http://localhost:8080/documents/:key/text

Chat: POST http://localhost:8080/api/chat

3. Frontend Setup (React)
   cd client
   npm install
   npm start

Opens React app on http://localhost:3000.

Features:

Chat panel to interact with AI.

Upload documents for processing.

Preview extracted text.

4. Ollama Local AI Setup

Install Ollama:

brew install ollama

Run the local LLM server:

ollama run llama2

Default API endpoint: http://localhost:11434/api/chat

Ensure server.js uses the same endpoint for AI calls.

API Endpoints
Endpoint Method Description
/health GET Server health check
/upload POST Upload a file (multipart/form-data)
/documents/:key GET Get signed URL for document
/documents/:key/text GET Extract text from document
/api/chat POST Chat with AI model (send messages)
Example Workflow

Upload a .txt or .pdf document via React UI.

Extract text from the document for preview.
Chat with AI to summarize or ask questions about the document.
Contributing
Fork the repository.
Create a feature branch (git checkout -b feature-name).
Commit your changes (git commit -m "feat: description").
Push to branch (git push origin feature-name).
Open a Pull Request.

License

MIT License

---

If you want, I can also **add a minimal diagram showing React → Node → S3 → Ollama flow** for easier understanding for new developers.

Do you want me to add that?
