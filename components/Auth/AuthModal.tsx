'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { signUp, signIn, signInWithGoogle, resetPassword } from '@/lib/firebase/auth';
import { createOrUpdateUserProfile } from '@/lib/firebase/userProfile';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';

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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { user } = useAuth();
  const { addToast } = useToast();

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

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      const userCredential = await signInWithGoogle();
      
      // Create or update user profile
      if (userCredential.user) {
        await createOrUpdateUserProfile(userCredential.user.uid, {
          email: userCredential.user.email || '',
          displayName: userCredential.user.displayName || 'User',
          role: 'student', // Default role
        });
      }
      
      addToast({
        title: 'Welcome!',
        description: `Signed in as ${userCredential.user.displayName || userCredential.user.email}`,
        type: 'success',
      });
      
      onClose();
    } catch (err: any) {
      console.error('Google auth error:', err);
      const errorMessage = err.code === 'auth/popup-closed-by-user' 
        ? 'Sign-in cancelled'
        : err.message || 'Failed to sign in with Google';
      setError(errorMessage);
      addToast({
        title: 'Error',
        description: errorMessage,
        type: 'error',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate input with Zod
      if (mode === 'signup') {
        signUpSchema.parse({ email, password, displayName: displayName || undefined });
        const userCredential = await signUp(email, password, displayName || undefined);
        // Create user profile in Firestore (default to student role)
        if (userCredential.user) {
          await createOrUpdateUserProfile(userCredential.user.uid, {
            email: userCredential.user.email || email,
            displayName: displayName || userCredential.user.displayName || 'User',
            role: 'student',
          });
        }
        addToast({
          title: 'Account created!',
          description: 'Welcome to ezstudy',
          type: 'success',
        });
        onClose();
      } else if (mode === 'signin') {
        signInSchema.parse({ email, password });
        await signIn(email, password);
        addToast({
          title: 'Welcome back!',
          description: 'Signed in successfully',
          type: 'success',
        });
        onClose();
      } else if (mode === 'forgot') {
        resetPasswordSchema.parse({ email });
        await resetPassword(email);
        setResetEmailSent(true);
        addToast({
          title: 'Email sent!',
          description: 'Check your inbox for password reset instructions',
          type: 'success',
        });
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      // Handle Zod validation errors
      if (err.errors && Array.isArray(err.errors)) {
        const validationError = err.errors[0]?.message || 'Validation error';
        setError(validationError);
        addToast({
          title: 'Validation Error',
          description: validationError,
          type: 'error',
        });
      } else {
        const errorMessage = err.message || 'An error occurred. Please try again.';
        setError(errorMessage);
        addToast({
          title: 'Error',
          description: errorMessage,
          type: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[1800] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'signin' && 'Sign In'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'forgot' && 'Reset Password'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {mode === 'signin' && 'Welcome back to ezstudy'}
              {mode === 'signup' && 'Start your learning journey'}
              {mode === 'forgot' && 'We&apos;ll help you reset your password'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-fade-in">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          {resetEmailSent ? (
            <div className="text-center py-8 animate-fade-in">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Check your email</h3>
              <p className="text-sm text-gray-600 mb-6">
                We&apos;ve sent a password reset link to <strong className="text-gray-900">{email}</strong>
              </p>
              <Button
                onClick={() => {
                  setMode('signin');
                  setResetEmailSent(false);
                }}
                variant="outline"
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <>
              {/* Google Sign In Button */}
              {(mode === 'signin' || mode === 'signup') && (
                <div className="mb-6">
                  <Button
                    onClick={handleGoogleSignIn}
                    disabled={loading || googleLoading}
                    variant="outline"
                    className="w-full"
                    leftIcon={
                      googleLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                      )
                    }
                  >
                    {googleLoading ? 'Signing in...' : `Continue with Google`}
                  </Button>
                  
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500 font-medium">Or continue with email</span>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
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
                      disabled={loading || googleLoading}
                    />
                  </div>
                </div>

                {/* Display Name (Sign Up only) */}
                {mode === 'signup' && (
                  <div>
                    <label htmlFor="displayName" className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name <span className="text-gray-400 font-normal">(Optional)</span>
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
                        disabled={loading || googleLoading}
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
                        disabled={loading || googleLoading}
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
                <Button
                  type="submit"
                  disabled={loading || googleLoading || !email || (mode !== 'forgot' && !password)}
                  variant="primary"
                  className="w-full"
                  loading={loading}
                >
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'signin' && 'Sign In'}
                  {mode === 'forgot' && 'Send Reset Link'}
                </Button>

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
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
