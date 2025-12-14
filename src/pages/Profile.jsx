import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { 
  ArrowLeft,
  User,
  Settings,
  Shield,
  Bell,
  Globe,
  Save
} from "lucide-react";
import Button from '../components/Button';
import Input from '../components/Input';
import Label from '../components/Label';
import Switch from '../components/Switch';
import './Profile.css';
import useToast from '../hooks/useToast';

const Profile = () => {
  const { toast } = useToast();
  const [nickname, setNickname] = useState("");
  const [preferences, setPreferences] = useState({
    showLocation: false,
    allowNotifications: true,
    preferSameLanguage: false,
    autoSkipInactive: true,
  });

  const handleSave = () => {
    toast({
      title: "Preferences saved",
      description: "Your settings have been updated successfully.",
    });
  };

  return (
    <div className="profile-container">
      {/* Header */}
      <header className="profile-header">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="header-icon" />
          </Button>
        </Link>
        <h1 className="profile-title">Profile & Settings</h1>
      </header>

      <div className="profile-content">
        {/* Profile Section */}
        <div className="profile-section">
          <div className="profile-header-row">
            <div className="avatar-container">
              <User className="avatar-icon" />
            </div>
            <div>
              <h2 className="section-title">Your Profile</h2>
              <p className="section-subtitle">Customize your chat experience</p>
            </div>
          </div>

          <div className="profile-form">
            <div className="form-group">
              <Label htmlFor="nickname">Display Name (Optional)</Label>
              <Input
                id="nickname"
                placeholder="Anonymous"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="nickname-input"
              />
              <p className="input-hint">
                This name may be shown to strangers you chat with
              </p>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="preferences-section">
          <div className="section-header">
            <div className="section-icon-container">
              <Settings className="section-icon" />
            </div>
            <h2 className="section-title">Chat Preferences</h2>
          </div>

          <div className="preferences-list">
            <div className="preference-item">
              <div className="preference-info">
                <Globe className="preference-icon" />
                <div>
                  <Label>Show Location</Label>
                  <p className="preference-description">Share your country with strangers</p>
                </div>
              </div>
              <Switch
                checked={preferences.showLocation}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, showLocation: checked }))
                }
              />
            </div>

            <div className="preference-item">
              <div className="preference-info">
                <Bell className="preference-icon" />
                <div>
                  <Label>Notifications</Label>
                  <p className="preference-description">Get notified when matched</p>
                </div>
              </div>
              <Switch
                checked={preferences.allowNotifications}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, allowNotifications: checked }))
                }
              />
            </div>

            <div className="preference-item">
              <div className="preference-info">
                <Globe className="preference-icon" />
                <div>
                  <Label>Same Language</Label>
                  <p className="preference-description">Prefer matching with same language speakers</p>
                </div>
              </div>
              <Switch
                checked={preferences.preferSameLanguage}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, preferSameLanguage: checked }))
                }
              />
            </div>

            <div className="preference-item">
              <div className="preference-info">
                <Settings className="preference-icon" />
                <div>
                  <Label>Auto-skip Inactive</Label>
                  <p className="preference-description">Skip users who don't respond</p>
                </div>
              </div>
              <Switch
                checked={preferences.autoSkipInactive}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, autoSkipInactive: checked }))
                }
              />
            </div>
          </div>
        </div>

        {/* Safety Section */}
        <div className="safety-section">
          <div className="section-header">
            <div className="section-icon-container accent">
              <Shield className="section-icon" />
            </div>
            <h2 className="section-title">Safety</h2>
          </div>
          <p className="safety-description">
            Your privacy is important. All chats are anonymous and not recorded. 
            You can skip or end any conversation at any time.
          </p>
          <ul className="safety-list">
            <li className="safety-item">
              <span className="safety-bullet" />
              No personal data stored
            </li>
            <li className="safety-item">
              <span className="safety-bullet" />
              Report inappropriate behavior
            </li>
            <li className="safety-item">
              <span className="safety-bullet" />
              Block users instantly
            </li>
          </ul>
        </div>

        {/* Premium Section (Future) */}
        <div className="premium-section">
          <h2 className="premium-title">Premium Features</h2>
          <p className="premium-description">
            Coming soon: Filter by interests, priority matching, and more!
          </p>
          <Button variant="outline" disabled>
            Coming Soon
          </Button>
        </div>

        {/* Save Button */}
        <Button variant="hero" className="save-button" onClick={handleSave}>
          <Save className="save-icon" />
          Save Preferences
        </Button>
      </div>
    </div>
  );
};

export default Profile;