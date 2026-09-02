import { useEffect, useState } from 'react';
import { api, ApiError, type User } from '../lib/api';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const rankColors = ['bg-primary-yellow', 'bg-muted', 'bg-primary-red text-white'] as const;
const roleColor = { MEMBER: 'outline', MENTOR: 'blue', MANAGER: 'red' } as const;

export function LeaderboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listUsers()
      .then(setUsers)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load leaderboard'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-8 sm:py-14">
      <h1 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl">Leaderboard</h1>

      {loading && <p className="font-bold text-black/50">Loading…</p>}
      {error && <p className="font-bold text-primary-red">{error}</p>}

      {!loading && (
        <Card decoration="circle" decorationColor="yellow" shadow="lg" className="divide-y-2 divide-black">
          {users.map((u, i) => (
            <div key={u.id} className="flex items-center gap-4 p-4 sm:p-5">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-black text-sm font-black ${
                  i < 3 ? rankColors[i] : 'bg-white'
                }`}
              >
                {i + 1}
              </span>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-black bg-muted text-xs font-black">
                {initials(u.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold">{u.name}</div>
                <Badge color={roleColor[u.role]}>{u.role}</Badge>
              </div>
              <span className="text-lg font-black text-primary-red">{u.coins}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
