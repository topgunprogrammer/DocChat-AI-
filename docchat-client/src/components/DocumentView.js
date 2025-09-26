import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import mammoth from "mammoth";

export default function DocumentView({ file }) {
  const [previewContent, setPreviewContent] = useState(null);

  useEffect(() => {
    const loadPreview = async () => {
      if (!file) return;

      const type = file.file.type;
      const fileObj = file.file;

      if (type === "application/pdf") {
        setPreviewContent(file.url); // PDF will be shown in iframe
      } else if (type === "text/plain") {
        const text = await fileObj.text();
        setPreviewContent(text);
      } else if (
        type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        type === "application/msword"
      ) {
        const arrayBuffer = await fileObj.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setPreviewContent(result.value);
      } else if (
        type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        fileObj.name.endsWith(".xlsx") ||
        fileObj.name.endsWith(".xls")
      ) {
        const data = await fileObj.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const sheetHtml = XLSX.utils.sheet_to_html(worksheet);
        setPreviewContent(sheetHtml);
      } else {
        setPreviewContent(null);
      }
    };

    loadPreview();
  }, [file]);

  const isPDF = file.file.type === "application/pdf";
  const isTextOrWord =
    file.file.type === "text/plain" ||
    file.file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.file.type === "application/msword";
  const isExcel =
    file.file.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.file.name.endsWith(".xlsx") ||
    file.file.name.endsWith(".xls");

  return (
    <div className="document-view">
      <h2>{file.file.name}</h2>
      <div
        style={{
          justifyContent: "center",
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          width: "100%",
          backgroundColor: "#f1f3f4",
          padding: "50px",
        }}
      >
        {isPDF ? (
          <iframe
            src={previewContent}
            title="PDF Preview"
            className="pdf-preview"
          />
        ) : isTextOrWord ? (
          <div className="doc-preview">{previewContent || "Loading..."}</div>
        ) : isExcel ? (
          <div
            className="doc-preview"
            dangerouslySetInnerHTML={{ __html: previewContent }}
          />
        ) : (
          <p>📄 Preview not available for this file type.</p>
        )}
      </div>
    </div>
  );
}
