import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  SkipForward, 
  Send, 
  ArrowLeft,
  User,
  Loader2
} from "lucide-react";
import Button from '../components/Button';
import Input from '../components/Input';
import './VideoChat.css';

const VideoChat = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const startSearch = () => {
    setIsSearching(true);
    // Simulate finding a partner
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
    
    // Simulate response
    setTimeout(() => {
      setMessages(prev => [...prev, { text: "Hello! Nice to meet you!", isOwn: false }]);
    }, 1000);
  };

  return (
    <div className="video-chat-container">
      {/* Header */}
      <header className="video-chat-header">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="header-icon" />
          </Button>
        </Link>
        <h1 className="video-chat-title">Video Chat</h1>
        {isConnected && (
          <span className="connection-status">
            <span className="connection-indicator" />
            Connected
          </span>
        )}
      </header>

      {/* Main Content */}
      <div className="video-chat-main">
        {/* Video Area */}
        <div className="video-area">
          <div className="video-grid">
            {/* Partner Video */}
            <div className="video-container partner-video">
              {!isConnected && !isSearching ? (
                <div className="connection-prompt">
                  <div className="user-avatar">
                    <User className="prompt-icon" />
                  </div>
                  <h3 className="prompt-title">Ready to Connect?</h3>
                  <p className="prompt-description">
                    Click the button below to find a random partner
                  </p>
                  <Button variant="hero" onClick={startSearch}>
                    Start Searching
                  </Button>
                </div>
              ) : isSearching ? (
                <div className="searching-overlay">
                  <Loader2 className="spinner" />
                  <p className="searching-text">Finding someone...</p>
                </div>
              ) : (
                <div className="partner-connected">
                  <div className="partner-avatar">
                    <User className="partner-icon" />
                  </div>
                  <span className="partner-label">Stranger</span>
                </div>
              )}
            </div>

            {/* Your Video */}
            <div className="video-container your-video">
              {isVideoOff ? (
                <div className="video-off-overlay">
                  <VideoOff className="video-off-icon" />
                </div>
              ) : (
                <div className="video-on-overlay">
                  <div className="your-avatar">
                    <User className="your-icon" />
                  </div>
                </div>
              )}
              <span className="your-label">You</span>
            </div>
          </div>

          {/* Controls */}
          <div className="video-controls">
            <Button
              variant={isMuted ? "destructive" : "secondary"}
              size="icon"
              className="control-button"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <MicOff className="control-icon" /> : <Mic className="control-icon" />}
            </Button>
            <Button
              variant={isVideoOff ? "destructive" : "secondary"}
              size="icon"
              className="control-button"
              onClick={() => setIsVideoOff(!isVideoOff)}
            >
              {isVideoOff ? <VideoOff className="control-icon" /> : <Video className="control-icon" />}
            </Button>
            {isConnected && (
              <>
                <Button
                  variant="connect"
                  size="icon"
                  className="control-button"
                  onClick={skipPartner}
                >
                  <SkipForward className="control-icon" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="control-button"
                  onClick={endCall}
                >
                  <PhoneOff className="control-icon" />
                </Button>
              </>
            )}
          </div>
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

export default VideoChat;