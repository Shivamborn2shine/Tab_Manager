import { useState } from 'react';
import { useTabStore } from '../store/useTabStore';
import { Sparkles, Command, PictureInPicture2, Cloud, LayoutGrid, Check, X } from 'lucide-react';

export default function WelcomeModal() {
  const setHasSeenWelcome = useTabStore((s) => s.setHasSeenWelcome);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setHasSeenWelcome(true);
    }, 300); // Wait for fade out animation
  };

  const features = [
    {
      icon: <Command size={24} className="text-blue-400" />,
      title: "Command Palette",
      description: "Press Ctrl + K (or Cmd + K) anywhere to instantly search all your saved tabs and jump between workspaces.",
      color: "#3b82f6"
    },
    {
      icon: <PictureInPicture2 size={24} className="text-purple-400" />,
      title: "Picture-in-Picture Mode",
      description: "Click the PiP icon in the top right to pop out Tab Manager into a mini, always-on-top window.",
      color: "#a855f7"
    },
    {
      icon: <LayoutGrid size={24} className="text-amber-400" />,
      title: "Drag, Drop & Batch Edit",
      description: "Organize tabs by dragging them between columns. Use the 'Select' button to move or delete multiple tabs at once.",
      color: "#f59e0b"
    },
    {
      icon: <Cloud size={24} className="text-emerald-400" />,
      title: "Cloud Synced",
      description: "Everything you save here is instantly synced to your account. Access your tabs from any device, anywhere.",
      color: "#10b981"
    }
  ];

  return (
    <div className={`modal-overlay ${isClosing ? 'fade-out' : 'fade-in'}`}>
      <div className="modal-content welcome-modal">
        <button className="modal-close-btn" onClick={handleClose}>
          <X size={20} />
        </button>
        
        <div className="welcome-header">
          <div className="welcome-icon-wrapper">
            <Sparkles size={32} className="welcome-icon" />
          </div>
          <h2 className="welcome-title">Welcome to Tab Manager 2.0!</h2>
          <p className="welcome-subtitle">
            Your premium workspace is ready. Here are a few pro-tips to help you get the most out of it:
          </p>
        </div>

        <div className="welcome-features-grid">
          {features.map((feature, idx) => (
            <div key={idx} className="welcome-feature-card">
              <div className="feature-icon-box" style={{ backgroundColor: `${feature.color}20`, color: feature.color }}>
                {feature.icon}
              </div>
              <div className="feature-text">
                <h4 className="feature-title">{feature.title}</h4>
                <p className="feature-desc">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="welcome-footer">
          <button className="welcome-start-btn" onClick={handleClose}>
            Get Started
            <Check size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
