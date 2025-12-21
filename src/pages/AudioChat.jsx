import React, { useState, useEffect, useRef } from 'react';
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
import { useSocket } from '../providers/SocketProvider';
import useToast from '../hooks/useToast';
import useWebRTC from '../hooks/useWebRTC';
import useLocalMedia from '../hooks/useLocalMedia';

const AudioChat = () => {
  const { socket, isConnected: isSocketConnected } = useSocket();
  const { toast } = useToast();

  const [isConnected, setIsConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [partnerId, setPartnerId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [role, setRole] = useState(null);


  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const messageInputRef = useRef(null);
  // 1. Persistent Local Media (Audio Only)
  // we pass false for video.
  const { localStream, mediaError, retryMedia } = useLocalMedia(false);

  // 2. WebRTC Hook (Audio Only)
  const { remoteStream } = useWebRTC(partnerId, role === 'initiator', localStream);

  // Audio Ref for remote stream
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      // Audio autoplay policy is usually lenient, but explicit play is safer
      remoteAudioRef.current.play().catch(e => console.error("Audio play error:", e));
    }
  }, [remoteStream]);

  // Navigation Cleanup
  useEffect(() => {
    return () => {
      if (socket) {
        socket.emit('skip-partner');
      }
    };
  }, [socket]);

  // Mobile keyboard handling using Visual Viewport (consistent with TextChat/VideoChat)
  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    if (!isMobile || !window.visualViewport) return;

    const handleResize = () => {
      if (chatContainerRef.current) {
        // Force the container height to match the VISIBLE screen
        chatContainerRef.current.style.height = `${window.visualViewport.height}px`;

        // Scroll to bottom after layout shift
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        }, 100);
      }
    };

    window.visualViewport.addEventListener("resize", handleResize);
    window.visualViewport.addEventListener("scroll", handleResize);

    handleResize();

    return () => {
      window.visualViewport.removeEventListener("resize", handleResize);
      window.visualViewport.removeEventListener("scroll", handleResize);
      if (chatContainerRef.current) {
        chatContainerRef.current.style.height = '';
      }
    };
  }, []);

  // Toggle Mute
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
    }
  }, [isMuted, localStream]);

  useEffect(() => {
    if (!socket) return;

    socket.on('match-found', ({ partnerId, role, sessionId }) => {
      setIsSearching(false);
      setIsConnected(true);
      setPartnerId(partnerId);
      setSessionId(sessionId);
      setRole(role);
      toast({ title: "Connected!", description: "Voice chat started." });
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
    });

    return () => {
      socket.off('match-found');
      socket.off('receive-message');
      socket.off('partner-disconnected');
    };
  }, [socket, toast]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (messagesContainerRef.current && isConnected) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isConnected]);

  const startSearch = () => {
    if (!isSocketConnected) {
      toast({ title: "Error", description: "Socket not connected", variant: "destructive" });
      return;
    }
    setIsSearching(true);
    socket.emit('start-searching', { type: 'audio' });
  };

  const skipPartner = () => {
    socket.emit('skip-partner');
    setIsConnected(false);
    setPartnerId(null);
    setSessionId(null);
    setRole(null);
    setMessages([]);
    startSearch();
  };

  const endCall = () => {
    if (isConnected) {
      socket.emit('skip-partner');
    }
    setIsConnected(false);
    setIsSearching(false);
    setMessages([]);
    setPartnerId(null);
    setRole(null);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !partnerId) return;

    setMessages(prev => [...prev, { text: message, isOwn: true }]);

    socket.emit('send-message', {
      to: partnerId,
      message,
      sessionId
    });

    setMessage("");
  };

  return (
    <div
      ref={chatContainerRef}
      className={`audio-chat-container ${isConnected ? 'is-connected' : ''}`}
    >
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

              {/* Hidden Audio Element for Remote Stream */}
              <audio ref={remoteAudioRef} autoPlay />

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
        <div className="audiochat-sidebar">
          <div className="chat-header">
            <h2 className="chat-title">Chat</h2>
          </div>

          <div
            ref={messagesContainerRef}
            className="audiochat-messages"
          >
            {messages.length === 0 ? (
              <p className="empty-chat">
                {isConnected ? "Say hello!" : "Connect to start chatting"}
              </p>
            ) : (
              <>
                {messages.map((msg, idx) => (
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
                ))}
                <div ref={messagesEndRef} />
              </>
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