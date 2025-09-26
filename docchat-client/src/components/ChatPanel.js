import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

export default function ChatPanel({ documentKey }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [documentText, setDocumentText] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Fetch document text once after upload
  useEffect(() => {
    if (!documentKey) return;
    const fetchDocument = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8080/documents/${documentKey}/text`
        );
        setDocumentText(res.data.text);
      } catch (err) {
        console.error("Failed to fetch document:", err);
      }
    };
    fetchDocument();
  }, [documentKey]);

  const sendMessage = async (text) => {
    if (!text) return;

    // Add user message
    setMessages((prev) => [...prev, { text, sender: "user" }]);
    setInput("");
    setLoading(true);

    try {
      // Prepare messages for API
      const chatMessages = [
        documentText
          ? {
              role: "system",
              content: `You have access to the following document. Use it to answer questions:\n\n${documentText}`,
            }
          : null,
        ...messages.map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        })),
        { role: "user", content: text },
      ].filter(Boolean);

      // Send to chat API
      const res = await axios.post("http://localhost:8080/api/chat", {
        messages: chatMessages,
      });

      // Add assistant message
      setMessages((prev) => [
        ...prev,
        { text: res.data.reply, sender: "assistant" },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { text: "Error communicating with server", sender: "assistant" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const summarizeDocument = async () => {
    if (!documentText) {
      setMessages((prev) => [
        ...prev,
        { text: "No document uploaded", sender: "assistant" },
      ]);
      return;
    }

    setLoading(true);
    try {
      const chatMessages = [
        {
          role: "system",
          content: `You have access to the following document. Summarize it concisely:\n\n${documentText}`,
        },
      ];

      const res = await axios.post("http://localhost:8080/api/chat", {
        messages: chatMessages,
      });

      setMessages((prev) => [
        ...prev,
        { text: res.data.reply, sender: "assistant" },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { text: "Failed to fetch document text", sender: "assistant" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.sender}`}>
            <span>{msg.text}</span>
          </div>
        ))}
        {loading && (
          <div className="chat-message assistant">
            <span className="typing">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: "10px", display: "flex", gap: "10px" }}>
        <button className="summarize-btn" onClick={summarizeDocument}>
          Summarize Document
        </button>
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={input}
          placeholder="Ask something..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
        />
        <button onClick={() => sendMessage(input)}>Send</button>
      </div>
    </div>
  );
}
