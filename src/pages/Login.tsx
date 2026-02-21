import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

const getUserIP = async (): Promise<string> => {
  const res = await fetch('https://api.ipify.org?format=json');
  const data = await res.json();
  return data.ip;
};

export default function Login() {
  console.log('Login component rendering...');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/read');
    }
  }, [user, navigate]);

  // On mount: check DB for an existing rate limit block
  useEffect(() => {
    const checkBlock = async () => {
      try {
        const ip = await getUserIP();
        if (!ip) return;
        const { data: blocked } = await supabase.rpc('check_rate_limit', { p_email: email, p_ip: ip });
        if (blocked) setIsRateLimited(true);
      } catch {
        // silently ignore — do not block the user if the check fails
      }
    };
    checkBlock();
  }, []);

  // When password field is cleared, reset eye to closed (hidden)
  useEffect(() => {
    if (password.length === 0) setShowPassword(false);
  }, [password]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const ip = await getUserIP();

      // Check DB block before attempting login
      const { data: blocked } = await supabase.rpc('check_rate_limit', { p_email: email, p_ip: ip });
      if (blocked) {
        setIsRateLimited(true);
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        // Record the failed attempt in DB
        await supabase.rpc('record_failed_attempt', { p_email: email, p_ip: ip });

        // Check if the user is now blocked after this attempt
        const { data: nowBlocked } = await supabase.rpc('check_rate_limit', { p_email: email, p_ip: ip });
        if (nowBlocked) {
          setIsRateLimited(true);
        } else {
          toast.error(error.message);
        }
      } else {
        // Reset the counter on successful login
        await supabase.rpc('reset_rate_limit', { p_email: email, p_ip: ip });
        toast.success('Login successful!');
        navigate('/read');
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader variant="landing" />
      <main className="flex-1 flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md shadow-lg animate-fade-in">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">Login</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    disabled={password.length === 0}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded p-1 disabled:opacity-50 disabled:pointer-events-none"
                    aria-label={password.length === 0 ? 'Show password (enter text first)' : showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={0}
                  >
                    {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading || isRateLimited}>
                {loading ? 'Logging in...' : 'Login'}
              </Button>
              {isRateLimited && (
                <p className="text-sm text-destructive text-center">
                  Too many failed attempts. Please try again after 10 minutes.
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                asChild
              >
                <Link to="/read">Continue as Guest</Link>
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Don't have an account?{' '}
              <Link to="/auth/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
