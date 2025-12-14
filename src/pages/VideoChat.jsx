import React, { useState, useEffect, useRef } from 'react';
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
import { useSocket } from '../providers/SocketProvider';
import useToast from '../hooks/useToast';
import useWebRTC from '../hooks/useWebRTC';

const VideoChat = () => {
  const { socket, isConnected: isSocketConnected } = useSocket();
  const { toast } = useToast();

  const [isConnected, setIsConnected] = useState(false); // Call connected
  const [isSearching, setIsSearching] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [partnerId, setPartnerId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [role, setRole] = useState(null);

  // WebRTC Hook
  const { localStream, remoteStream } = useWebRTC(partnerId, role === 'initiator', true);

  // Video Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Effect to toggle Tracks based on mute/video-off state
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
      localStream.getVideoTracks().forEach(track => track.enabled = !isVideoOff);
    }
  }, [isMuted, isVideoOff, localStream]);

  useEffect(() => {
    if (!socket) return;

    socket.on('match-found', ({ partnerId, role, sessionId }) => {
      setIsSearching(false);
      setIsConnected(true);
      setPartnerId(partnerId);
      setSessionId(sessionId);
      setRole(role);
      toast({ title: "Connected!", description: "You are now chatting with a stranger." });

      // Initialize WebRTC here based on role
      console.log(`Matched as ${role} with ${partnerId}`);
    });

    socket.on('receive-message', ({ message, sender }) => {
      setMessages(prev => [...prev, { text: message, isOwn: false }]);
    });

    socket.on('partner-disconnected', () => {
      setIsConnected(false);
      setPartnerId(null);
      setSessionId(null);
      setRole(null);
      toast({ title: "Partner disconnected", variant: "destructive" });
      // Optionally auto-search again?
    });

    return () => {
      socket.off('match-found');
      socket.off('receive-message');
      socket.off('partner-disconnected');
    };
  }, [socket, toast]);

  const startSearch = () => {
    if (!isSocketConnected) {
      toast({ title: "Error", description: "Socket not connected", variant: "destructive" });
      return;
    }
    setIsSearching(true);
    socket.emit('start-searching', { type: 'video' });
  };

  const skipPartner = () => {
    socket.emit('skip-partner');
    setIsConnected(false);
    setPartnerId(null);
    setSessionId(null);
    setRole(null);
    setMessages([]);
    // Auto start searching again
    startSearch();
  };

  const endCall = () => {
    if (isConnected) { // Only emit skip (disconnect) if actually connected
      socket.emit('skip-partner');
    }
    // If just searching, we might want to tell backend to remove from queue, 
    // but current backend implementation handles disconnect/skip logic generically.
    // Ideally add a 'cancel-search' event later. For now, skip works or just navigating away.
    setIsConnected(false);
    setIsSearching(false);
    setMessages([]);
    setPartnerId(null);
    setRole(null);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !partnerId) return;

    // Optimistic update
    setMessages(prev => [...prev, { text: message, isOwn: true }]);

    socket.emit('send-message', {
      to: partnerId,
      message,
      sessionId
    });

    setMessage("");
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
                <>
                  {remoteStream ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="video-element"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="partner-connected">
                      <div className="partner-avatar">
                        <User className="partner-icon" />
                      </div>
                      <span className="partner-label">Connecting...</span>
                    </div>
                  )}
                  <div className="partner-connected-overlay">
                    <span className="partner-label">Stranger</span>
                  </div>
                </>
              )}
            </div>

            {/* Your Video */}
            <div className="video-container your-video">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`video-element ${isVideoOff ? 'hidden-video' : ''}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: isVideoOff ? 'none' : 'block' }}
              />

              {isVideoOff ? (
                <div className="video-off-overlay">
                  <VideoOff className="video-off-icon" />
                </div>
              ) : null}
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