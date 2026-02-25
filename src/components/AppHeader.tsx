import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { useMe } from '@/hooks/useMe';
import { copy } from '@/lib/copy';
import { toast } from 'sonner';

interface AppHeaderProps {
  variant?: 'landing' | 'app';
}

export function AppHeader({ variant = 'app' }: AppHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { authUser, loading } = useMe();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  return (
    <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl group">
            <BookOpen className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {copy.name}
            </span>
          </Link>
          
          {variant === 'app' && (
            <nav className="hidden md:flex items-center gap-1">
              <Button
                variant={location.pathname === '/read' ? 'secondary' : 'ghost'}
                asChild
                size="sm"
              >
                <Link to="/read">Read</Link>
              </Button>
              {authUser && (
                <Button
                  variant={location.pathname === '/library' ? 'secondary' : 'ghost'}
                  asChild
                  size="sm"
                >
                  <Link to="/library">Library</Link>
                </Button>
              )}
              <Button
                variant={location.pathname === '/settings' ? 'secondary' : 'ghost'}
                asChild
                size="sm"
              >
                <Link to="/settings">Settings</Link>
              </Button>
            </nav>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!loading && authUser ? (
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </Button>
          ) : !loading && variant === 'landing' ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth/login')}>
                Log in
              </Button>
              <Button size="sm" onClick={() => navigate('/read')}>
                Try as Guest
              </Button>
            </>
          ) : !loading ? (
            <Button variant="outline" size="sm" onClick={() => navigate('/auth/login')}>
              Log in
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
