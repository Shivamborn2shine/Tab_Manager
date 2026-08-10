import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Layers, Chrome, Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';

export default function AuthPage() {
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);
  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail);
  const authError = useAuthStore((s) => s.authError);
  const authLoading = useAuthStore((s) => s.authLoading);
  const clearError = useAuthStore((s) => s.clearError);

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleToggleMode = () => {
    setIsSignUp((v) => !v);
    clearError();
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setSubmitting(true);
    if (isSignUp) {
      await signUpWithEmail(email.trim(), password, displayName.trim());
    } else {
      await signInWithEmail(email.trim(), password);
    }
    setSubmitting(false);
  };

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    await signInWithGoogle();
    setSubmitting(false);
  };

  return (
    <div className="auth-page">
      {/* Left Panel — Branding */}
      <div className="auth-brand">
        <div className="auth-brand-bg"></div>
        <div className="auth-brand-content">
          <div className="auth-brand-logo">
            <div className="auth-brand-logo-icon">
              <Layers size={32} />
            </div>
            <div>
              <h1 className="auth-brand-title">Tab Manager</h1>
              <span className="auth-brand-version">2.0</span>
            </div>
          </div>

          <h2 className="auth-brand-headline">
            Organize hundreds of tabs<br />
            <span className="auth-brand-highlight">across workspaces.</span>
          </h2>

          <p className="auth-brand-description">
            The smartest way to manage browser tabs. Drag-and-drop collections, 
            instant search, cloud sync, and Chrome extension support.
          </p>

          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">
                <Zap size={18} />
              </div>
              <div>
                <div className="auth-feature-title">Lightning Fast</div>
                <div className="auth-feature-desc">Instant search across all your tabs</div>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">
                <Shield size={18} />
              </div>
              <div>
                <div className="auth-feature-title">Cloud Synced</div>
                <div className="auth-feature-desc">Your tabs, on every device</div>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="auth-feature-title">Smart Collections</div>
                <div className="auth-feature-desc">Organize by project, topic, or workflow</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Auth Form */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>{isSignUp ? 'Create your account' : 'Welcome back'}</h2>
            <p>
              {isSignUp
                ? 'Start organizing your tabs in seconds'
                : 'Sign in to access your tabs'}
            </p>
          </div>

          {/* Google Sign-In */}
          <button
            className="auth-google-btn"
            onClick={handleGoogleSignIn}
            disabled={submitting || authLoading}
          >
            <svg className="auth-google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="auth-divider">
            <span>or continue with email</span>
          </div>

          {/* Email/Password Form */}
          <form className="auth-form" onSubmit={handleEmailSubmit}>
            {isSignUp && (
              <div className="auth-input-group">
                <User size={16} className="auth-input-icon" />
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            )}

            <div className="auth-input-group">
              <Mail size={16} className="auth-input-icon" />
              <input
                className="auth-input"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-input-group">
              <Lock size={16} className="auth-input-icon" />
              <input
                className="auth-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
                minLength={6}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {authError && (
              <div className="auth-error">{authError}</div>
            )}

            <button
              className="auth-submit-btn"
              type="submit"
              disabled={submitting || authLoading}
            >
              {submitting ? (
                <div className="auth-btn-spinner"></div>
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="auth-toggle">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button className="auth-toggle-btn" onClick={handleToggleMode}>
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </div>

          <div className="auth-footer-note">
            <Chrome size={14} />
            Works with our Chrome Extension for one-click tab saving
          </div>
        </div>
      </div>
    </div>
  );
}
