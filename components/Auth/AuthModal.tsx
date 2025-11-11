'use client';

import { useState, useEffect } from 'react';
import { X, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { signUp, signIn, resetPassword } from '@/lib/firebase/auth';
import { createOrUpdateUserProfile } from '@/lib/firebase/userProfile';
import { useAuth } from '@/hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup' | 'forgot';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      onClose();
    }
  }, [user, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setMode(initialMode);
      setEmail('');
      setPassword('');
      setDisplayName('');
      setError(null);
      setResetEmailSent(false);
    }
  }, [isOpen, initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const userCredential = await signUp(email, password, displayName || undefined);
        // Create user profile in Firestore (default to student role)
        if (userCredential.user) {
          await createOrUpdateUserProfile(userCredential.user.uid, {
            email: userCredential.user.email || email,
            displayName: displayName || userCredential.user.displayName || 'User',
            role: 'student', // Default role - can be changed later
          });
        }
        onClose();
      } else if (mode === 'signin') {
        await signIn(email, password);
        onClose();
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setResetEmailSent(true);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'signin' && 'Sign In'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-fade-in">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          {resetEmailSent ? (
            <div className="p-6 bg-green-50 border border-green-200 rounded-xl text-center animate-fade-in">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Check your email</h3>
              <p className="text-sm text-gray-600 mb-4">
                    We&apos;ve sent a password reset link to <strong>{email}</strong>
              </p>
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setResetEmailSent(false);
                }}
                className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="input pl-12"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Display Name (Sign Up only) */}
              {mode === 'signup' && (
                <div>
                  <label htmlFor="displayName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name (Optional)
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="John Doe"
                      className="input pl-12"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {/* Password (Sign In & Sign Up) */}
              {mode !== 'forgot' && (
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                      required
                      minLength={6}
                      className="input pl-12"
                      disabled={loading}
                    />
                  </div>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium mt-2"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !email || (mode !== 'forgot' && !password)}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {mode === 'signup' && 'Creating Account...'}
                    {mode === 'signin' && 'Signing In...'}
                    {mode === 'forgot' && 'Sending...'}
                  </>
                ) : (
                  <>
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'signin' && 'Sign In'}
                    {mode === 'forgot' && 'Send Reset Link'}
                  </>
                )}
              </button>

              {/* Mode Switch */}
              <div className="text-center pt-4 border-t border-gray-200">
                {mode === 'signin' && (
                  <p className="text-sm text-gray-600">
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="text-primary-600 hover:text-primary-700 font-semibold"
                    >
                      Sign Up
                    </button>
                  </p>
                )}
                {mode === 'signup' && (
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signin')}
                      className="text-primary-600 hover:text-primary-700 font-semibold"
                    >
                      Sign In
                    </button>
                  </p>
                )}
                {mode === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
                  >
                    Back to Sign In
                  </button>
                )}
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

