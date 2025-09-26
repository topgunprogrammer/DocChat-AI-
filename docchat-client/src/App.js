import React, { useState } from "react";
import UploadPage from "./components/UploadPage";
import DocumentView from "./components/DocumentView";
import ChatPanel from "./components/ChatPanel";
import Header from "./components/Header"; // <-- import the header component
import "./App.css";

export default function App() {
  const [uploadedFile, setUploadedFile] = useState(null);

  return (
    <div className="app">
      <Header /> {/* <-- Add Header at the top */}
      {!uploadedFile ? (
        <UploadPage onUpload={setUploadedFile} />
      ) : (
        <div className="main-layout">
          <DocumentView file={uploadedFile} />
          <ChatPanel documentKey={uploadedFile.key} />
        </div>
      )}
    </div>
  );
}
