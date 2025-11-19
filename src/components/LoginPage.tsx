import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dumbbell, Mail, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { signUp, signIn, signInWithOAuth } from '../lib/auth';

interface LoginPageProps {
  onLogin: (user: any) => void;
  onSignUp?: (user: any) => void;
}

export function LoginPage({ onLogin, onSignUp }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (isSignUp && !name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { user, session, error } = await signUp({ email, password, name: name.trim() });
        
        if (error) {
          toast.error(error.message || 'Failed to create account');
          return;
        }

        if (user) {
          toast.success('Account created! Please check your email to verify your account.');
          if (onSignUp) {
            onSignUp(user);
          }
          // Auto-login after signup if session is available
          if (session) {
            onLogin(user);
          }
        }
      } else {
        const { user, session, error } = await signIn({ email, password });
        
        if (error) {
          // Check if user doesn't exist - Supabase returns "Invalid login credentials" for both wrong password and non-existent user
          // This is a security feature to prevent email enumeration
          const errorMsg = error.message || '';
          if (errorMsg.includes('Invalid login credentials') || 
              errorMsg.includes('Email not confirmed') ||
              errorMsg.includes('User not found')) {
            toast.error('No account found with this email. Please sign up first.');
            // Auto-switch to signup mode after a brief delay
            setTimeout(() => {
              setIsSignUp(true);
              toast.info('Switched to sign up. Please create an account.');
            }, 1500);
          } else {
            toast.error(error.message || 'Invalid email or password');
          }
          return;
        }

        if (user) {
          toast.success('Signed in successfully!');
          onLogin(user);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    setLoading(true);
    try {
      const { data, error } = await signInWithOAuth(provider);
      
      if (error) {
        toast.error(error.message || `Failed to sign in with ${provider}`);
        setLoading(false);
        return;
      }

      // OAuth will automatically sign up new users or sign in existing users
      // This is standard OAuth behavior - no separate signup needed
      toast.loading(`Redirecting to ${provider === 'google' ? 'Google' : 'Apple'}...`);
    } catch (error: any) {
      toast.error(error.message || `Failed to sign in with ${provider}`);
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    // Demo login - you can keep this for testing or remove it
    toast.info('Demo login disabled. Please sign up or sign in.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
              <Dumbbell className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl">AmakaFlow</CardTitle>
            <CardDescription className="mt-2">
              Transform workout content into structured training for your devices
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  required
                  minLength={6}
                />
              </div>
              {isSignUp && (
                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthLogin('google')}
              className="w-full gap-2"
              disabled={loading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthLogin('apple')}
              className="w-full gap-2 !bg-black !text-white hover:!bg-gray-900 !border-black dark:!bg-black dark:!text-white"
              disabled={loading}
              style={{ backgroundColor: '#000', color: '#fff', borderColor: '#000' }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              {isSignUp ? 'Sign up with Apple' : 'Sign in with Apple'}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              {isSignUp 
                ? 'OAuth will create an account if you don\'t have one'
                : 'OAuth will sign you in or create an account automatically'}
            </p>
          </div>

          <div className="text-center text-sm space-y-2">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setName('');
                setEmail('');
                setPassword('');
              }}
              className="text-primary hover:underline font-medium"
              disabled={loading}
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
            {!isSignUp && (
              <p className="text-xs text-muted-foreground">
                Trying to sign in? OAuth buttons work for both new and existing accounts.
              </p>
            )}
          </div>

          <div className="pt-4 border-t">
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Free Tier Includes:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>1 workout export per week</li>
                <li>All device formats (Garmin, Apple, Zwift)</li>
                <li>AI-powered exercise mapping</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}