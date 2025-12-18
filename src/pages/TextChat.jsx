import React, { useState, useEffect, useRef } from 'react'; // Add useRef
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
import { useSocket } from '../providers/SocketProvider';
import useToast from '../hooks/useToast';

const TextChat = () => {
    const { socket, isConnected: isSocketConnected } = useSocket();
    const { toast } = useToast();

    const [isConnected, setIsConnected] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);

    const [partnerId, setPartnerId] = useState(null);
    const [sessionId, setSessionId] = useState(null);

    // Add these refs
    const chatContainerRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const messageInputRef = useRef(null);

    useEffect(() => {
        return () => {
            if (socket) {
                socket.emit('skip-partner');
            }
        };
    }, [socket]);

    // Add this useEffect for mobile keyboard handling (same as VideoChat)
    useEffect(() => {
        // Only run this logic on mobile devices
        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        if (!isMobile || !window.visualViewport) return;

        const handleResize = () => {
        if (chatContainerRef.current) {
            // Force the container height to match the VISIBLE screen exactly
            // This pushes the bottom of the div UP to sit on the keyboard
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
        window.visualViewport.addEventListener("scroll", handleResize); // Listen to scroll too for iOS

        // Initial check
        handleResize();

        return () => {
        window.visualViewport.removeEventListener("resize", handleResize);
        window.visualViewport.removeEventListener("scroll", handleResize);
        
        // Cleanup: Reset height to CSS default when leaving
        if (chatContainerRef.current) {
            chatContainerRef.current.style.height = ''; 
        }
        };
    }, []); // Run when connection status changes

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesContainerRef.current && isConnected) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages, isConnected]);

    useEffect(() => {
        if (!socket) return;

        socket.on('match-found', ({ partnerId, role, sessionId }) => {
            setIsSearching(false);
            setIsConnected(true);
            setPartnerId(partnerId);
            setSessionId(sessionId);
            toast({ title: "Connected!", description: "Start chatting!" });
        });

        socket.on('receive-message', ({ message, sender }) => {
            setMessages(prev => [...prev, { text: message, isOwn: false }]);
        });

        socket.on('partner-disconnected', () => {
            setIsConnected(false);
            setPartnerId(null);
            setSessionId(null);
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
        socket.emit('start-searching', { type: 'text' });
    };

    const skipPartner = () => {
        socket.emit('skip-partner');
        setIsConnected(false);
        setPartnerId(null);
        setSessionId(null);
        setMessages([]);
        startSearch();
    };

    const endChat = () => {
        if (isConnected) {
            socket.emit('skip-partner');
        }
        setIsConnected(false);
        setIsSearching(false);
        setMessages([]);
        setPartnerId(null);
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

    // Handle input focus for mobile
    const handleInputFocus = () => {
        if (window.innerWidth <= 768 && messagesContainerRef.current) {
            setTimeout(() => {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            }, 100);
        }
    };

    return (
        <div className="text-chat-container" ref={chatContainerRef}>
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
                        {/* Messages Area - Add ref */}
                        <div className="messages-container" ref={messagesContainerRef}>
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

                        {/* Input Area - Add ref and onFocus handler */}
                        <form onSubmit={sendMessage} className="input-form">
                            <div className="input-wrapper">
                                <Input
                                    ref={messageInputRef}
                                    placeholder="Type your message..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onFocus={handleInputFocus}
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