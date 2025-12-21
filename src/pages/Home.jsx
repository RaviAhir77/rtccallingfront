import React from 'react';
import { Link } from "react-router-dom";
import { Video, Phone, MessageCircle, Shield, Users, Zap, Activity } from "lucide-react";
import Button from '../components/Button';
import { useSocket } from '../providers/SocketProvider';

const Home = () => {
  const { stats } = useSocket();

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            RandomChat
          </Link>
          <nav className="nav-desktop">
            <Link to="/video" className="nav-link">
              Video Chat
            </Link>
            <Link to="/audio" className="nav-link">
              Audio Chat
            </Link>
            <Link to="/text" className="nav-link">
              Text Chat
            </Link>
          </nav>
          <div className="header-buttons">
            <Link to="/profile">
              <Button variant="ghost" size="sm">Profile</Button>
            </Link>
            <Link to="/video">
              <Button variant="hero" size="sm">Start Chatting</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            {/* Live Stats Banner */}
            <div className="stats-banner-container">
              <div className="stats-banner">
                <div className="stat-item highlight-stat">
                  <Activity className="stat-icon pulse-animation" />
                  <span className="stat-value">{stats.totalUsers}</span>
                  <span className="stat-label">Online</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <Video className="stat-icon" />
                  <span className="stat-value">{stats.videoUsers}</span>
                  <span className="stat-label">Video</span>
                </div>
                <div className="stat-item">
                  <Phone className="stat-icon" />
                  <span className="stat-value">{stats.audioUsers}</span>
                  <span className="stat-label">Audio</span>
                </div>
                <div className="stat-item">
                  <MessageCircle className="stat-icon" />
                  <span className="stat-value">{stats.textUsers}</span>
                  <span className="stat-label">Text</span>
                </div>
              </div>
            </div>

            <span className="badge">
              Meet New People Instantly
            </span>
            <h1 className="hero-title">
              Connect with Strangers
              <span className="highlight">Around the World</span>
            </h1>
            <p className="hero-description">
              Video chat, voice call, or text with random people from anywhere.
              Simple, anonymous, and fun.
            </p>
            <div className="hero-buttons">
              <Link to="/video">
                <Button variant="hero" size="xl">
                  <Video className="button-icon" />
                  Start Video Chat
                </Button>
              </Link>
              <Link to="/text">
                <Button variant="outline" size="xl">
                  <MessageCircle className="button-icon" />
                  Text Only
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <h2 className="section-title">Choose Your Way to Connect</h2>
          <div className="features-grid">
            <Link to="/video" className="feature-card-link">
              <div className="feature-card">
                <div className="feature-icon video-icon">
                  <Video className="icon-large" />
                </div>
                <h3 className="feature-title">Video Chat</h3>
                <p className="feature-description">
                  Face-to-face conversations with random strangers. See and be seen.
                </p>
              </div>
            </Link>
            <Link to="/audio" className="feature-card-link">
              <div className="feature-card">
                <div className="feature-icon audio-icon">
                  <Phone className="icon-large" />
                </div>
                <h3 className="feature-title">Audio Call</h3>
                <p className="feature-description">
                  Voice-only calls for when you want to talk without video.
                </p>
              </div>
            </Link>
            <Link to="/text" className="feature-card-link">
              <div className="feature-card">
                <div className="feature-icon text-icon">
                  <MessageCircle className="icon-large" />
                </div>
                <h3 className="feature-title">Text Chat</h3>
                <p className="feature-description">
                  Classic text messaging with random people. Simple and anonymous.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="trust-section">
        <div className="trust-container">
          <div className="trust-grid">
            <div className="trust-item">
              <div className="trust-icon">
                <Shield className="icon-medium" />
              </div>
              <h3 className="trust-title">Anonymous & Safe</h3>
              <p className="trust-description">No registration required. Your privacy is protected.</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon accent">
                <Users className="icon-medium" />
              </div>
              <h3 className="trust-title">Global Community</h3>
              <p className="trust-description">Connect with people from all around the world.</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <Zap className="icon-medium" />
              </div>
              <h3 className="trust-title">Instant Matching</h3>
              <p className="trust-description">Get connected with someone new in seconds.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <p className="footer-text">
              © 2024 RandomChat. All rights reserved.
            </p>
            <div className="footer-links">
              <Link to="/privacy" className="footer-link">
                Privacy Policy
              </Link>
              <Link to="/terms" className="footer-link">
                Terms of Service
              </Link>
              <Link to="/guidelines" className="footer-link">
                Community Guidelines
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;