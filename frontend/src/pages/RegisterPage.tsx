import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import type { Role } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Logo } from '../components/ui/Logo';
import { inputClass, labelClass } from '../components/ui/inputStyles';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('MEMBER');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(name, email, password, role);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background bauhaus-dots px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Logo size="lg" />
          <p className="font-bold uppercase tracking-widest text-black/60">For members, mentors &amp; managers</p>
        </div>

        <Card decoration="triangle" decorationColor="yellow">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 sm:p-8">
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Name</span>
              <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Email</span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Password</span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Role</span>
              <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={inputClass}>
                <option value="MEMBER">Member</option>
                <option value="MENTOR">Mentor</option>
                <option value="MANAGER">Manager</option>
              </select>
            </label>
            {error && <p className="text-sm font-bold text-primary-red">{error}</p>}
            <Button type="submit" variant="primary" disabled={submitting} className="mt-2 w-full">
              {submitting ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm font-medium">
          Already have an account?{' '}
          <Link to="/login" className="font-bold underline decoration-2 underline-offset-2 hover:text-primary-blue">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
