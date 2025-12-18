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
  Loader2,
  MessageSquare,
  X
} from "lucide-react";
import Button from '../components/Button';
import Input from '../components/Input';
import './VideoChat.css';
import { useSocket } from '../providers/SocketProvider';
import useToast from '../hooks/useToast';
import useWebRTC from '../hooks/useWebRTC';
import useLocalMedia from '../hooks/useLocalMedia';
import useMobileKeyboardHandler from '../hooks/useMobileKeyboardHandler';


const VideoChat = () => {
  const { socket, isConnected: isSocketConnected } = useSocket();
  const { toast } = useToast();

  const [isConnected, setIsConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showChat, setShowChat] = useState(false); // New state for mobile chat

  const [partnerId, setPartnerId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [role, setRole] = useState(null);

  const { localStream, mediaError, retryMedia } = useLocalMedia(true);
  const { remoteStream, connectionState } = useWebRTC(partnerId, role === 'initiator', localStream);
  const { keyboardHeight, isKeyboardVisible } = useMobileKeyboardHandler();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const chatInputRef = useRef(null);

  // Auto-scroll to bottom of chat when new message arrives
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (socket) {
        console.log("Navigating away, cleaning up...");
        socket.emit('skip-partner');
      }
    };
  }, [socket]);

  const playVideo = async (videoRef, streamName) => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        console.log(`${streamName} video is playing`);
      } catch (err) {
        console.error(`Error playing ${streamName} video:`, err);
      }
    }
  };

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      playVideo(localVideoRef, "Local");
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      playVideo(remoteVideoRef, "Remote");
    }
  }, [remoteStream]);

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
      setMessages([]);
      toast({ title: "Partner disconnected", variant: "destructive" });
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
    setPartnerId(null);
    setRole(null);
    socket.emit('start-searching', { type: 'video' });
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

  const scrollChatToBottom = () => {
    if (chatMessagesRef.current) {
      setTimeout(() => {
        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
      }, 100);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    scrollChatToBottom();
  };

  // Auto-focus input when chat opens on mobile
  useEffect(() => {
    if (showChat && chatInputRef.current && window.innerWidth <= 768) {
      setTimeout(() => {
        chatInputRef.current.focus();
      }, 300);
    }
  }, [showChat]);


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
                      onLoadedMetadata={() => playVideo(remoteVideoRef, "Remote")}
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
                onLoadedMetadata={() => playVideo(localVideoRef, "Local")}
                className={`video-element ${isVideoOff ? 'hidden-video' : ''}`}
                style={{ display: isVideoOff ? 'none' : 'block' }}
              />

              {mediaError && (
                <div className="media-error-overlay">
                  <p className="media-error-title">Camera Error</p>
                  <p className="media-error-description">{mediaError}</p>
                  <Button variant="secondary" size="sm" onClick={retryMedia}>Retry Camera</Button>
                </div>
              )}

              {!localStream && !mediaError && (
                <div className="retry-overlay">
                  <Button variant="ghost" size="sm" onClick={retryMedia} title="Retry Permissions">
                    <VideoOff className="retry-icon" />
                  </Button>
                </div>
              )}

              {isVideoOff ? (
                <div className="video-off-overlay">
                  <VideoOff className="video-off-icon" />
                </div>
              ) : null}
              <span className="your-label">You</span>
            </div>
          </div>

          {/* Controls */}
          <div className="controls-container">
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

              {/* Chat Toggle Button for Mobile */}
              <div className="mobile-chat-toggle">
                <Button
                  variant="secondary"
                  size="icon"
                  className="control-button"
                  onClick={() => setShowChat(!showChat)}
                >
                  {showChat ? <X className="control-icon" /> : <MessageSquare className="control-icon" />}
                  {messages.length > 0 && !showChat && (
                    <span className="message-badge">{messages.length}</span>
                  )}
                </Button>
              </div>

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
        </div>

        {/* Desktop Chat Sidebar (always visible on desktop) */}
        <div className="chat-sidebar desktop-chat">
          <div className="chat-header">
            <h2 className="chat-title">Chat</h2>
          </div>

          <div className="chat-messages" ref={chatMessagesRef}>
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

        {/* Mobile Chat Drawer - UPDATED */}
        <div
          className={`mobile-chat-drawer ${showChat ? 'open' : ''} ${isKeyboardVisible ? 'keyboard-open' : ''}`}
        >
          <div className="chat-drawer-header">
            <h2 className="chat-title">Chat</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowChat(false);
                if (chatInputRef.current) {
                  chatInputRef.current.blur();
                }
              }}
            >
              <X className="header-icon" />
            </Button>
          </div>

          <div 
            className="chat-messages" 
            ref={chatMessagesRef}
          >
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
                ref={chatInputRef}
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onFocus={handleInputFocus}
                disabled={!isConnected}
                className="chat-input"
              />
              <Button type="submit" size="icon" disabled={!isConnected || !message.trim()}>
                <Send className="send-icon" />
              </Button>
            </div>
          </form>
        </div>

        {/* Overlay when mobile chat is open */}
        {showChat && <div className="mobile-chat-overlay" onClick={() => setShowChat(false)} />}
      </div>
    </div>
  );
};

export default VideoChat;