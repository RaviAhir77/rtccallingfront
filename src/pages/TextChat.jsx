import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { 
  Send, 
  ArrowLeft,
  User,
  Loader2,
  SkipForward,
  X,
  MessageCircle
} from "lucide-react";
import Button from '../components/Button';
import Input from '../components/Input';
import './TextChat.css';

const TextChat = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const startSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setIsConnected(true);
      setMessages([{ text: "Stranger has connected!", isOwn: false }]);
    }, 2000);
  };

  const skipPartner = () => {
    setIsConnected(false);
    setMessages([]);
    startSearch();
  };

  const endChat = () => {
    setIsConnected(false);
    setIsSearching(false);
    setMessages([]);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setMessages(prev => [...prev, { text: message, isOwn: true }]);
    setMessage("");
    
    // Simulate response
    setTimeout(() => {
      const responses = [
        "That's interesting!",
        "Tell me more about yourself",
        "Where are you from?",
        "Nice to meet you!",
        "What do you like to do?",
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, { text: randomResponse, isOwn: false }]);
    }, 1500);
  };

  return (
    <div className="text-chat-container">
      {/* Header */}
      <header className="text-chat-header">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="header-icon" />
          </Button>
        </Link>
        <h1 className="text-chat-title">Text Chat</h1>
        {isConnected && (
          <div className="connection-controls">
            <span className="connection-status">
              <span className="connection-indicator" />
              Connected with Stranger
            </span>
            <Button variant="ghost" size="sm" onClick={skipPartner}>
              <SkipForward className="skip-icon" />
              Next
            </Button>
            <Button variant="ghost" size="icon" onClick={endChat}>
              <X className="end-icon" />
            </Button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="text-chat-main">
        {!isConnected && !isSearching ? (
          <div className="start-state1">
            <div className="start-content">
              <div className="chat-icon-container">
                <MessageCircle className="chat-icon" />
              </div>
              <h2 className="start-title">Text Chat</h2>
              <p className="start-description">
                Chat anonymously with random strangers. Just text, nothing else.
              </p>
              <Button variant="hero" size="lg" onClick={startSearch}>
                Start Chatting
              </Button>
            </div>
          </div>
        ) : isSearching ? (
          <div className="searching-state">
            <div className="searching-content">
              <Loader2 className="spinner" />
              <p className="searching-text">Looking for a stranger...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Messages Area */}
            <div className="messages-container">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`message-row ${msg.isOwn ? "own-message" : "partner-message"}`}
                >
                  <div className={`message-wrapper ${msg.isOwn ? "own-wrapper" : "partner-wrapper"}`}>
                    <div className={`avatar-container ${msg.isOwn ? "own-avatar" : "partner-avatar"}`}>
                      <User className="avatar-icon" />
                    </div>
                    <div className={`message-bubble ${msg.isOwn ? "own-bubble" : "partner-bubble"}`}>
                      <p className="message-text">{msg.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="input-form">
              <div className="input-wrapper">
                <Input
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="message-input"
                  autoFocus
                />
                <Button type="submit" disabled={!message.trim()}>
                  <Send className="send-icon" />
                  Send
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default TextChat;