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

  const [showDebug, setShowDebug] = useState(false);

  // WebRTC Hook
  const { localStream, remoteStream, connectionState, mediaError, retryMedia } = useWebRTC(partnerId, role === 'initiator', true);


  // Video Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Helper to safely play video
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

  const startSearch = () => {
    if (!isSocketConnected) {
      toast({ title: "Error", description: "Socket not connected", variant: "destructive" });
      return;
    }
    setIsSearching(true);
    // Ensure cleanup of previous state if any
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
    // Auto start searching again
    startSearch();
  };

  const endCall = () => {
    if (isConnected) { // Only emit skip (disconnect) if actually connected
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
                      onLoadedMetadata={() => playVideo(remoteVideoRef, "Remote")}
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
                onLoadedMetadata={() => playVideo(localVideoRef, "Local")}
                className={`video-element ${isVideoOff ? 'hidden-video' : ''}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: isVideoOff ? 'none' : 'block' }}
              />

              {/* Error overlay if media error exists */}
              {mediaError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4 text-center">
                  <p className="text-red-400 font-bold mb-2">Camera Error</p>
                  <p className="text-xs mb-4">{mediaError}</p>
                  <Button variant="secondary" size="sm" onClick={retryMedia}>Retry Camera</Button>
                </div>
              )}

              {/* Manual Retry if no stream but no error yet (hidden by video if playing) */}
              {!localStream && !mediaError && (
                <div className="absolute top-2 right-2">
                  <Button variant="ghost" size="sm" onClick={retryMedia} title="Retry Permissions">
                    <VideoOff className="w-4 h-4 text-white" />
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

          {/* Controls & Debug */}
          <div className="flex flex-col gap-4">
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

            {/* Mobile Debug Panel Toggle */}
            <div className="text-center">
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="text-xs text-muted-foreground underline"
              >
                {showDebug ? "Hide Debug Logs" : "Show Debug Logs"}
              </button>
              {showDebug && (
                <div className="mt-2 p-2 bg-black text-green-400 text-xs text-left h-32 overflow-y-auto font-mono rounded border border-gray-700">
                  <p>Secure Context: {window.isSecureContext ? "Yes" : "No"}</p>
                  <p>MediaDevices: {navigator.mediaDevices ? "Available" : "Undefined"}</p>
                  <p>Local Stream: {localStream ? localStream.id : "Null"}</p>
                  <p>Connection State: {connectionState}</p>
                  <p>Error: {mediaError || "None"}</p>
                </div>
              )}
            </div>
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