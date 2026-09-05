import { Router, type RequestHandler } from "express";
import { AttendanceStatus, Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const eventsRouter = Router();

const asyncHandler = (fn: RequestHandler): RequestHandler => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const attendanceInclude = {
  user: { select: { id: true, name: true } },
  confirmedBy: { select: { id: true, name: true } },
} as const;

const RECURRENCE_FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY"] as const;
type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];
const MAX_OCCURRENCES = 52;

function advance(date: Date, frequency: RecurrenceFrequency): Date {
  const next = new Date(date);
  if (frequency === "DAILY") next.setDate(next.getDate() + 1);
  else if (frequency === "WEEKLY") next.setDate(next.getDate() + 7);
  else next.setMonth(next.getMonth() + 1);
  return next;
}

function buildOccurrences(startsAt: Date, endsAt: Date | null, frequency: RecurrenceFrequency, until: Date) {
  const durationMs = endsAt ? endsAt.getTime() - startsAt.getTime() : null;
  const occurrences: { startsAt: Date; endsAt: Date | null }[] = [];
  let currentStart = startsAt;
  while (currentStart <= until && occurrences.length < MAX_OCCURRENCES) {
    occurrences.push({ startsAt: currentStart, endsAt: durationMs !== null ? new Date(currentStart.getTime() + durationMs) : null });
    currentStart = advance(currentStart, frequency);
  }
  return occurrences;
}

eventsRouter.use(requireAuth);

eventsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const events = await prisma.event.findMany({
      orderBy: { startsAt: "asc" },
      include: {
        createdBy: { select: { id: true, name: true } },
        attendances: { select: { id: true, status: true, coinsAwarded: true, requestedAt: true, confirmedAt: true, ...attendanceInclude } },
      },
    });
    res.json(events);
  }),
);

eventsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { title, description, location, startsAt, endsAt, coinValue, repeat } = req.body ?? {};

    if (typeof title !== "string" || !title.trim()) {
      res.status(400).json({ error: "Title is required" });
      return;
    }
    const startsAtDate = new Date(startsAt);
    if (Number.isNaN(startsAtDate.getTime())) {
      res.status(400).json({ error: "A valid start date/time is required" });
      return;
    }
    const endsAtDate = endsAt ? new Date(endsAt) : null;
    if (endsAtDate && Number.isNaN(endsAtDate.getTime())) {
      res.status(400).json({ error: "End date/time is invalid" });
      return;
    }
    let coinValueNum = 10;
    if (coinValue !== undefined) {
      coinValueNum = Number(coinValue);
      if (!Number.isInteger(coinValueNum) || coinValueNum <= 0) {
        res.status(400).json({ error: "coinValue must be a positive integer" });
        return;
      }
    }

    const baseData = {
      title: title.trim(),
      description: description || null,
      location: location || null,
      coinValue: coinValueNum,
      createdById: req.user!.userId,
    };

    if (repeat) {
      const frequency = repeat.frequency;
      if (!RECURRENCE_FREQUENCIES.includes(frequency)) {
        res.status(400).json({ error: "repeat.frequency must be DAILY, WEEKLY, or MONTHLY" });
        return;
      }
      const untilDate = new Date(repeat.until);
      if (Number.isNaN(untilDate.getTime()) || untilDate < startsAtDate) {
        res.status(400).json({ error: "repeat.until must be a valid date on or after the start date" });
        return;
      }

      const occurrences = buildOccurrences(startsAtDate, endsAtDate, frequency, untilDate);
      await prisma.event.createMany({
        data: occurrences.map((o) => ({ ...baseData, startsAt: o.startsAt, endsAt: o.endsAt })),
      });
      res.status(201).json({ count: occurrences.length });
      return;
    }

    const event = await prisma.event.create({
      data: { ...baseData, startsAt: startsAtDate, endsAt: endsAtDate },
    });
    res.status(201).json(event);
  }),
);

eventsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    const isOwner = event.createdById === req.user!.userId;
    const isPrivileged = req.user!.role === Role.MENTOR || req.user!.role === Role.MANAGER;
    if (!isOwner && !isPrivileged) {
      res.status(403).json({ error: "Only the creator, a mentor, or a manager can remove this event" });
      return;
    }
    await prisma.event.delete({ where: { id: req.params.id } });
    res.status(204).end();
  }),
);

// Student/member self-reports attendance. "attended: true" starts a pending
// approval; "attended: false" is a self-finalized record that needs no
// mentor/manager review and never awards coins.
eventsRouter.post(
  "/:id/signup",
  asyncHandler(async (req, res) => {
    const eventId = req.params.id;
    const userId = req.user!.userId;
    const attended = req.body?.attended !== false;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const existing = await prisma.attendance.findUnique({ where: { eventId_userId: { eventId, userId } } });
    if (existing) {
      res.status(409).json({ error: "You've already signed off for this event" });
      return;
    }

    const attendance = await prisma.attendance.create({
      data: attended
        ? { eventId, userId, coinsAwarded: event.coinValue }
        : { eventId, userId, coinsAwarded: 0, status: AttendanceStatus.DECLINED, confirmedAt: new Date() },
      include: attendanceInclude,
    });
    res.status(201).json(attendance);
  }),
);

// Mentor/manager confirms a pending self-report; this is what awards the coins.
eventsRouter.post(
  "/:id/attendance/:userId/confirm",
  requireRole(Role.MENTOR, Role.MANAGER),
  asyncHandler(async (req, res) => {
    const { id: eventId, userId } = req.params;

    const attendance = await prisma.attendance.findUnique({ where: { eventId_userId: { eventId, userId } } });
    if (!attendance) {
      res.status(404).json({ error: "No sign-off request found for this person" });
      return;
    }
    if (attendance.status === AttendanceStatus.CONFIRMED) {
      res.status(409).json({ error: "Already confirmed" });
      return;
    }

    const [updated] = await prisma.$transaction([
      prisma.attendance.update({
        where: { eventId_userId: { eventId, userId } },
        data: { status: AttendanceStatus.CONFIRMED, confirmedById: req.user!.userId, confirmedAt: new Date() },
        include: attendanceInclude,
      }),
      prisma.user.update({ where: { id: userId }, data: { coins: { increment: attendance.coinsAwarded } } }),
    ]);

    res.json(updated);
  }),
);

// Cancel/reject a pending request: the requester can cancel their own, a mentor/manager can reject anyone's.
eventsRouter.delete(
  "/:id/attendance/:userId",
  asyncHandler(async (req, res) => {
    const { id: eventId, userId } = req.params;

    const attendance = await prisma.attendance.findUnique({ where: { eventId_userId: { eventId, userId } } });
    if (!attendance) {
      res.status(404).json({ error: "No sign-off request found for this person" });
      return;
    }
    if (attendance.status === AttendanceStatus.CONFIRMED) {
      res.status(409).json({ error: "This attendance has already been confirmed and can't be removed here" });
      return;
    }
    const isSelf = req.user!.userId === userId;
    const isPrivileged = req.user!.role === Role.MENTOR || req.user!.role === Role.MANAGER;
    if (!isSelf && !isPrivileged) {
      res.status(403).json({ error: "Only the requester, a mentor, or a manager can remove this request" });
      return;
    }

    await prisma.attendance.delete({ where: { eventId_userId: { eventId, userId } } });
    res.status(204).end();
  }),
);
