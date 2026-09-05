import { useEffect, useState } from 'react';
import { api, ApiError, type StatsOverview } from '../lib/api';
import { Card } from '../components/ui/Card';

const TILE_COLORS = ['red', 'blue', 'yellow', 'red'] as const;

function StatTile({ label, value, color }: { label: string; value: number; color: 'red' | 'blue' | 'yellow' }) {
  const bg = { red: 'bg-primary-red text-white', blue: 'bg-primary-blue text-white', yellow: 'bg-primary-yellow text-black' }[color];
  return (
    <div className={`border-4 border-black p-5 shadow-hard-md ${bg}`}>
      <div className="text-4xl font-black tabular-nums">{value}</div>
      <div className="mt-1 text-xs font-bold uppercase tracking-widest opacity-80">{label}</div>
    </div>
  );
}

function TurnoutBar({ confirmed, total }: { confirmed: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((confirmed / total) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-4 w-32 border-2 border-black bg-white sm:w-48">
        <div className="h-full bg-primary-blue" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-black/60">
        {confirmed}/{total}
      </span>
    </div>
  );
}

export function StatsPage() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getStats()
      .then(setStats)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-8 sm:py-14">
      <h1 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl">Stats</h1>

      {loading && <p className="font-bold text-black/50">Loading…</p>}
      {error && <p className="font-bold text-primary-red">{error}</p>}

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Students" value={stats.summary.totalStudents} color={TILE_COLORS[0]} />
            <StatTile label="Events" value={stats.summary.totalEvents} color={TILE_COLORS[1]} />
            <StatTile label="Confirmed sign-offs" value={stats.summary.totalConfirmedAttendances} color={TILE_COLORS[2]} />
            <StatTile label="Coins awarded" value={stats.summary.totalCoinsAwarded} color={TILE_COLORS[3]} />
          </div>

          <div>
            <h2 className="mb-3 text-2xl font-black uppercase tracking-tight">Students</h2>
            <Card decoration="circle" decorationColor="blue" shadow="lg" className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b-4 border-black text-xs font-bold uppercase tracking-widest text-black/50">
                    <th className="p-3">Name</th>
                    <th className="p-3">Confirmed</th>
                    <th className="p-3">Pending</th>
                    <th className="p-3">Declined</th>
                    <th className="p-3">Coins</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.students.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 font-bold text-black/40">
                        No students yet.
                      </td>
                    </tr>
                  )}
                  {stats.students.map((s) => (
                    <tr key={s.id} className="border-b-2 border-black/10 last:border-0">
                      <td className="p-3 font-bold">{s.name}</td>
                      <td className="p-3 font-bold text-primary-blue">{s.confirmed}</td>
                      <td className="p-3 font-bold">{s.pending}</td>
                      <td className="p-3 text-black/50">{s.declined}</td>
                      <td className="p-3 font-black text-primary-red">{s.coins}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          <div>
            <h2 className="mb-3 text-2xl font-black uppercase tracking-tight">Events</h2>
            <Card decoration="square" decorationColor="yellow" shadow="lg" className="divide-y-2 divide-black">
              {stats.events.length === 0 && <p className="p-5 font-bold text-black/40">No events yet.</p>}
              {stats.events.map((e) => (
                <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
                  <div>
                    <div className="font-bold">{e.title}</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-black/40">
                      {new Date(e.startsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      {e.pending > 0 && <span className="ml-2 text-primary-red">{e.pending} pending</span>}
                    </div>
                  </div>
                  <TurnoutBar confirmed={e.confirmed} total={e.totalStudents} />
                </div>
              ))}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
