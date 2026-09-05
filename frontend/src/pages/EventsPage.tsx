import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Check, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError, type EventItem, type RecurrenceFrequency } from '../lib/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { inputClass, labelClass } from '../components/ui/inputStyles';

type PaletteColor = 'red' | 'blue' | 'yellow';
const PALETTE: PaletteColor[] = ['red', 'blue', 'yellow'];
const chipClasses: Record<PaletteColor, string> = {
  red: 'bg-primary-red text-white',
  blue: 'bg-primary-blue text-white',
  yellow: 'bg-primary-yellow text-black',
};

function canApprove(role: string) {
  return role === 'MENTOR' || role === 'MANAGER';
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function isSameDay(a: Date, b: Date) {
  return dateKey(a) === dateKey(b);
}

function buildMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay());
  const lastOfMonth = new Date(year, month + 1, 0);
  const gridEnd = new Date(year, month, lastOfMonth.getDate() + (6 - lastOfMonth.getDay()));

  const days: Date[] = [];
  for (const d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function PendingApprovals({ event, onChanged }: { event: EventItem; onChanged: () => void }) {
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pending = event.attendances.filter((a) => a.status === 'PENDING');

  if (pending.length === 0) return null;

  async function approve(userId: string) {
    setError(null);
    setBusyUserId(userId);
    try {
      await api.confirmAttendance(event.id, userId);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
      setBusyUserId(null);
    }
  }

  async function reject(userId: string) {
    setError(null);
    setBusyUserId(userId);
    try {
      await api.cancelAttendance(event.id, userId);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
      setBusyUserId(null);
    }
  }

  return (
    <div className="border-t-2 border-black pt-4">
      <Badge color="yellow" className="mb-3">
        {pending.length} awaiting approval
      </Badge>
      <div className="flex flex-col gap-3">
        {pending.map((a) => (
          <div key={a.id} className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-black bg-muted text-xs font-black">
              {initials(a.user.name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold">{a.user.name}</div>
              <div className="text-xs font-medium text-black/50">
                requested {timeAgo(a.requestedAt)} · <span className="font-bold text-primary-red">{a.coinsAwarded} coins</span>
              </div>
            </div>
            <Button variant="primary" size="icon" disabled={busyUserId === a.user.id} onClick={() => approve(a.user.id)} aria-label="Approve">
              <Check className="h-4 w-4" strokeWidth={3} />
            </Button>
            <Button variant="outline" size="icon" disabled={busyUserId === a.user.id} onClick={() => reject(a.user.id)} aria-label="Reject">
              <X className="h-4 w-4" strokeWidth={3} />
            </Button>
          </div>
        ))}
      </div>
      {error && <p className="mt-2 text-sm font-bold text-primary-red">{error}</p>}
    </div>
  );
}

function ConfirmedList({ attendances }: { attendances: EventItem['attendances'] }) {
  const confirmed = attendances.filter((a) => a.status === 'CONFIRMED');
  if (confirmed.length === 0) return null;

  return (
    <ul className="flex flex-col gap-1.5 border-t-2 border-black pt-3 text-sm">
      {confirmed.map((a) => (
        <li key={a.id} className="flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0 text-primary-blue" strokeWidth={3} />
          <span className="font-bold">{a.user.name}</span>
          <span className="text-black/60">
            earned <span className="font-bold text-primary-blue">{a.coinsAwarded} coins</span>
            {a.confirmedBy && ` · by ${a.confirmedBy.name}`}
          </span>
        </li>
      ))}
    </ul>
  );
}

function MyAttendanceAction({ event, onChanged }: { event: EventItem; onChanged: () => void }) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!user) return null;

  // Only students earn coins for attending; mentors/managers run events, they don't self-report.
  if (user.role !== 'MEMBER') return null;

  const mine = event.attendances.find((a) => a.user.id === user.id);

  async function signUp(attended: boolean) {
    setError(null);
    setSubmitting(true);
    try {
      await api.signUp(event.id, attended);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  }

  async function cancel() {
    if (!user) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.cancelAttendance(event.id, user.id);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
      setSubmitting(false);
    }
  }

  if (!mine) {
    return (
      <div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => signUp(true)} disabled={submitting}>
            {submitting ? 'Saving…' : `I was here (+${event.coinValue} coins)`}
          </Button>
          <Button variant="outline" onClick={() => signUp(false)} disabled={submitting}>
            I was not here
          </Button>
        </div>
        {error && <p className="mt-2 text-sm font-bold text-primary-red">{error}</p>}
      </div>
    );
  }

  if (mine.status === 'PENDING') {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Badge color="yellow">Waiting for approval</Badge>
        <Button variant="ghost" onClick={cancel} disabled={submitting}>
          Cancel
        </Button>
        {error && <p className="text-sm font-bold text-primary-red">{error}</p>}
      </div>
    );
  }

  if (mine.status === 'DECLINED') {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Badge color="outline">You said you weren't here</Badge>
        <Button variant="ghost" onClick={cancel} disabled={submitting}>
          Undo
        </Button>
        {error && <p className="text-sm font-bold text-primary-red">{error}</p>}
      </div>
    );
  }

  return (
    <Badge color="blue" className="text-[11px]">
      <Check className="h-3 w-3" strokeWidth={3} /> Confirmed · +{mine.coinsAwarded} coins
    </Badge>
  );
}

function EventDetailCard({ event, index, onChanged }: { event: EventItem; index: number; onChanged: () => void }) {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = user && (user.id === event.createdBy.id || canApprove(user.role));
  const start = new Date(event.startsAt);
  const decoColor = PALETTE[index % PALETTE.length];
  const decoShape = (['circle', 'square', 'triangle'] as const)[index % 3];

  async function handleDelete() {
    setError(null);
    setDeleting(true);
    try {
      await api.deleteEvent(event.id);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
      setDeleting(false);
    }
  }

  return (
    <Card decoration={decoShape} decorationColor={decoColor} shadow="md" className="p-5 sm:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight">{event.title}</h3>
            <p className="mt-0.5 text-sm font-bold text-black/50">
              {start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              {event.endsAt ? ` – ${new Date(event.endsAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}` : ''}
              {event.location ? ` · ${event.location}` : ''}
            </p>
          </div>
          {canDelete && (
            <Button
              variant="outline"
              className="border-primary-red text-primary-red hover:bg-primary-red/10"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Removing…' : 'Remove'}
            </Button>
          )}
        </div>

        {event.description && <p className="font-medium text-black/80">{event.description}</p>}

        <p className="text-xs font-bold uppercase tracking-widest text-black/40">
          Added by {event.createdBy.name} · <span className="text-primary-red">{event.coinValue} coins</span> for attending
        </p>

        <MyAttendanceAction event={event} onChanged={onChanged} />

        {user && canApprove(user.role) && <PendingApprovals event={event} onChanged={onChanged} />}

        <ConfirmedList attendances={event.attendances} />

        {error && <p className="text-sm font-bold text-primary-red">{error}</p>}
      </div>
    </Card>
  );
}

function AddEventForm({ prefillDate, onCreated, onCancel }: { prefillDate: Date; onCreated: () => void; onCancel: () => void }) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const prefillValue = `${prefillDate.getFullYear()}-${pad(prefillDate.getMonth() + 1)}-${pad(prefillDate.getDate())}T09:00`;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState(prefillValue);
  const [endsAt, setEndsAt] = useState('');
  const [coinValue, setCoinValue] = useState(10);
  const [repeatFrequency, setRepeatFrequency] = useState<'NONE' | RecurrenceFrequency>('NONE');
  const [repeatUntil, setRepeatUntil] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.createEvent({
        title,
        description: description || undefined,
        location: location || undefined,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
        coinValue,
        repeat:
          repeatFrequency === 'NONE' || !repeatUntil
            ? undefined
            : { frequency: repeatFrequency, until: new Date(`${repeatUntil}T23:59:59`).toISOString() },
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card decoration="square" decorationColor="yellow" shadow="md" className="p-5 sm:p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Title</span>
          <input required autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Description (optional)</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Location (optional)</span>
          <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
        </label>
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className={labelClass}>Starts</span>
            <input type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className={labelClass}>Ends (optional)</span>
            <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Coins</span>
            <input
              type="number"
              min={1}
              value={coinValue}
              onChange={(e) => setCoinValue(Number(e.target.value))}
              className={`${inputClass} w-24`}
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className={labelClass}>Repeat</span>
            <select
              value={repeatFrequency}
              onChange={(e) => setRepeatFrequency(e.target.value as 'NONE' | RecurrenceFrequency)}
              className={inputClass}
            >
              <option value="NONE">Does not repeat</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </label>
          {repeatFrequency !== 'NONE' && (
            <label className="flex flex-1 flex-col gap-1.5">
              <span className={labelClass}>Repeat until</span>
              <input type="date" required value={repeatUntil} onChange={(e) => setRepeatUntil(e.target.value)} className={inputClass} />
            </label>
          )}
        </div>
        {error && <p className="text-sm font-bold text-primary-red">{error}</p>}
        <div className="mt-1 flex gap-3">
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Adding…' : repeatFrequency === 'NONE' ? 'Add event' : 'Add events'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

function Calendar({
  monthDate,
  eventsByDay,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onToday,
}: {
  monthDate: Date;
  eventsByDay: Map<string, EventItem[]>;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}) {
  const days = useMemo(() => buildMonthGrid(monthDate.getFullYear(), monthDate.getMonth()), [monthDate]);
  const today = new Date();

  return (
    <Card shadow="lg" className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-black uppercase tracking-tighter sm:text-3xl">
          {monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={onPrevMonth} aria-label="Previous month">
            <ChevronLeft className="h-5 w-5" strokeWidth={3} />
          </Button>
          <Button variant="outline" onClick={onToday}>
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={onNextMonth} aria-label="Next month">
            <ChevronRight className="h-5 w-5" strokeWidth={3} />
          </Button>
        </div>
      </div>

      <div className="mb-1.5 grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold uppercase tracking-widest text-black/40 sm:gap-2">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((day) => {
          const dayEvents = eventsByDay.get(dateKey(day)) ?? [];
          const outside = day.getMonth() !== monthDate.getMonth();
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDate(day)}
              className={[
                'relative flex min-h-[52px] flex-col items-start gap-1 overflow-hidden border-2 p-1 text-left transition-transform duration-200 ease-out sm:min-h-[76px] sm:p-1.5',
                isSelected ? 'border-black bg-primary-blue text-white' : 'border-black bg-white hover:-translate-y-0.5',
                outside && !isSelected ? 'bg-muted text-black/40' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {isToday && !isSelected && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary-red" />}
              <span className="text-xs font-black sm:text-sm">{day.getDate()}</span>
              <span className="flex w-full flex-col gap-0.5">
                {dayEvents.slice(0, 2).map((e, i) => (
                  <span
                    key={e.id}
                    className={`hidden truncate border border-black px-1 text-[9px] font-bold uppercase sm:block ${
                      isSelected ? 'border-white/60 bg-white/20 text-white' : chipClasses[PALETTE[i % PALETTE.length]]
                    }`}
                  >
                    {e.title}
                  </span>
                ))}
                {dayEvents.length > 0 && (
                  <span className={`h-1.5 w-1.5 rounded-full sm:hidden ${isSelected ? 'bg-white' : 'bg-primary-red'}`} />
                )}
                {dayEvents.length > 2 && <span className={`hidden text-[9px] font-bold sm:block ${isSelected ? 'text-white/80' : 'text-black/40'}`}>+{dayEvents.length - 2} more</span>}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

export function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthDate, setMonthDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [addingEvent, setAddingEvent] = useState(false);

  async function refresh() {
    setError(null);
    try {
      const eventsData = await api.listEvents();
      setEvents(eventsData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const event of events) {
      const key = dateKey(new Date(event.startsAt));
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    }
    return map;
  }, [events]);

  const selectedEvents = eventsByDay.get(dateKey(selectedDate)) ?? [];

  function changeMonth(offset: number) {
    setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  }

  function goToday() {
    const now = new Date();
    setMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  }

  function selectDate(d: Date) {
    setSelectedDate(d);
    setAddingEvent(false);
    if (d.getMonth() !== monthDate.getMonth() || d.getFullYear() !== monthDate.getFullYear()) {
      setMonthDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-8 sm:py-14">
      <h1 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl">Events</h1>

      {loading && <p className="font-bold text-black/50">Loading events…</p>}
      {error && <p className="font-bold text-primary-red">{error}</p>}

      {!loading && (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[3fr_2fr]">
          <Calendar
            monthDate={monthDate}
            eventsByDay={eventsByDay}
            selectedDate={selectedDate}
            onSelectDate={selectDate}
            onPrevMonth={() => changeMonth(-1)}
            onNextMonth={() => changeMonth(1)}
            onToday={goToday}
          />

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black uppercase tracking-tight">
                {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </h2>
              {!addingEvent && (
                <Button variant="primary" onClick={() => setAddingEvent(true)}>
                  <Plus className="h-4 w-4" strokeWidth={3} /> Add event
                </Button>
              )}
            </div>

            {addingEvent && (
              <AddEventForm
                prefillDate={selectedDate}
                onCreated={() => {
                  setAddingEvent(false);
                  refresh();
                }}
                onCancel={() => setAddingEvent(false)}
              />
            )}

            {selectedEvents.length === 0 && !addingEvent && <p className="font-bold text-black/40">No events on this day.</p>}

            {selectedEvents.map((event, i) => (
              <EventDetailCard key={event.id} event={event} index={i} onChanged={refresh} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
