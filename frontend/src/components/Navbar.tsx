import { LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Logo } from './ui/Logo';

const roleColor = { MEMBER: 'outline', MENTOR: 'blue', MANAGER: 'red' } as const;

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b-4 border-black bg-white px-4 py-3 sm:px-8">
      <div className="flex items-center gap-6">
        <Logo />
        <nav className="flex gap-1">
          {[
            { to: '/', label: 'Events', end: true },
            { to: '/leaderboard', label: 'Leaderboard', end: false },
            ...(user.role === 'MENTOR' || user.role === 'MANAGER' ? [{ to: '/stats', label: 'Stats', end: false }] : []),
          ].map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                [
                  'rounded-full px-4 py-1.5 text-sm font-bold uppercase tracking-wide transition-colors duration-200',
                  isActive ? 'bg-black text-white' : 'text-black hover:bg-muted',
                ].join(' ')
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <Badge color={roleColor[user.role]}>{user.role}</Badge>
        <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-black bg-primary-yellow px-3 py-1 text-sm font-black">
          <span className="h-3 w-3 rounded-full border border-black bg-white" />
          {user.coins}
        </span>
        <Button
          variant="outline"
          size="icon"
          shape="pill"
          onClick={() => {
            logout().then(() => navigate('/login'));
          }}
          aria-label="Log out"
        >
          <LogOut className="h-4 w-4" strokeWidth={2.5} />
        </Button>
      </div>
    </header>
  );
}
