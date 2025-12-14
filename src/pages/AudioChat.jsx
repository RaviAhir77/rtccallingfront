import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { 
  Mic, 
  MicOff, 
  PhoneOff, 
  SkipForward, 
  Send, 
  ArrowLeft,
  User,
  Loader2,
  Volume2
} from "lucide-react";
import Button from '../components/Button';
import Input from '../components/Input';
import './AudioChat.css';

const AudioChat = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const startSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setIsConnected(true);
    }, 2000);
  };

  const skipPartner = () => {
    setIsConnected(false);
    setMessages([]);
    startSearch();
  };

  const endCall = () => {
    setIsConnected(false);
    setIsSearching(false);
    setMessages([]);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setMessages(prev => [...prev, { text: message, isOwn: true }]);
    setMessage("");
    
    setTimeout(() => {
      setMessages(prev => [...prev, { text: "Hey! How are you?", isOwn: false }]);
    }, 1000);
  };

  return (
    <div className="audio-chat-container">
      {/* Header */}
      <header className="audio-chat-header">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="header-icon" />
          </Button>
        </Link>
        <h1 className="audio-chat-title">Audio Chat</h1>
        {isConnected && (
          <span className="connection-status">
            <span className="connection-indicator" />
            Connected
          </span>
        )}
      </header>

      {/* Main Content */}
      <div className="audio-chat-main">
        {/* Audio Area */}
        <div className="audio-area">
          {!isConnected && !isSearching ? (
            <div className="start-state">
              <div className="voice-icon-container">
                <div className="voice-icon-wrapper">
                  <Volume2 className="voice-icon" />
                </div>
              </div>
              <h3 className="state-title">Voice Chat</h3>
              <p className="state-description">
                Connect with random people through voice. Camera-free conversations.
              </p>
              <Button variant="accent" size="xl" onClick={startSearch}>
                Find Someone to Talk
              </Button>
            </div>
          ) : isSearching ? (
            <div className="searching-state">
              <Loader2 className="spinner" />
              <p className="searching-text">Searching for someone...</p>
            </div>
          ) : (
            <div className="connected-state">
              <div className="avatars-container">
                {/* Partner Avatar */}
                <div className="avatar-wrapper partner-avatar-wrapper">
                  <div className="avatar partner-avatar">
                    <User className="avatar-icon" />
                  </div>
                  <span className="avatar-label">Stranger</span>
                  <div className="avatar-ping" />
                </div>

                {/* Connection Line */}
                <div className="connection-line" />

                {/* Your Avatar */}
                <div className="avatar-wrapper your-avatar-wrapper">
                  <div className="avatar your-avatar">
                    <User className="avatar-icon" />
                  </div>
                  <span className="avatar-label">You</span>
                </div>
              </div>

              <p className="status-text">Voice chat in progress...</p>

              {/* Controls */}
              <div className="audio-controls">
                <Button
                  variant={isMuted ? "destructive" : "secondary"}
                  size="icon"
                  className="control-button audio-button"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <MicOff className="control-icon" /> : <Mic className="control-icon" />}
                </Button>
                <Button
                  variant="connect"
                  size="icon"
                  className="control-button audio-button"
                  onClick={skipPartner}
                >
                  <SkipForward className="control-icon" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="control-button audio-button"
                  onClick={endCall}
                >
                  <PhoneOff className="control-icon" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        <div className="chat-sidebar">
          <div className="chat-header">
            <h2 className="chat-title">Chat</h2>
          </div>
          
          <div className="chat-messages">
            {messages.length === 0 ? (
              <p className="empty-chat">
                {isConnected ? "Say hello!" : "Connect to start chatting"}
              </p>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`message-container ${msg.isOwn ? "own-message" : "partner-message"}`}
                >
                  <div
                    className={`message-bubble ${msg.isOwn ? "own-bubble" : "partner-bubble"}`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={sendMessage} className="chat-input-form">
            <div className="input-container">
              <Input
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={!isConnected}
                className="chat-input"
              />
              <Button type="submit" size="icon" disabled={!isConnected || !message.trim()}>
                <Send className="send-icon" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AudioChat;