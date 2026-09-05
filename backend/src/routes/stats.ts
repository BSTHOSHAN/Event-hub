import { Router, type RequestHandler } from "express";
import { AttendanceStatus, Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const statsRouter = Router();

const asyncHandler = (fn: RequestHandler): RequestHandler => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

function countByStatus(attendances: { status: AttendanceStatus }[]) {
  return {
    confirmed: attendances.filter((a) => a.status === AttendanceStatus.CONFIRMED).length,
    pending: attendances.filter((a) => a.status === AttendanceStatus.PENDING).length,
    declined: attendances.filter((a) => a.status === AttendanceStatus.DECLINED).length,
  };
}

// Mentor/manager-only overview: per-student participation and per-event turnout.
statsRouter.get(
  "/",
  requireAuth,
  requireRole(Role.MENTOR, Role.MANAGER),
  asyncHandler(async (_req, res) => {
    const [students, events] = await Promise.all([
      prisma.user.findMany({
        where: { role: Role.MEMBER },
        select: { id: true, name: true, coins: true, attendances: { select: { status: true } } },
      }),
      prisma.event.findMany({
        orderBy: { startsAt: "desc" },
        select: { id: true, title: true, startsAt: true, attendances: { select: { status: true } } },
      }),
    ]);

    const totalStudents = students.length;

    const studentStats = students
      .map((s) => ({ id: s.id, name: s.name, coins: s.coins, ...countByStatus(s.attendances) }))
      .sort((a, b) => b.coins - a.coins);

    const eventStats = events.map((e) => ({
      id: e.id,
      title: e.title,
      startsAt: e.startsAt,
      totalStudents,
      ...countByStatus(e.attendances),
    }));

    const summary = {
      totalStudents,
      totalEvents: events.length,
      totalConfirmedAttendances: studentStats.reduce((sum, s) => sum + s.confirmed, 0),
      totalPendingRequests: studentStats.reduce((sum, s) => sum + s.pending, 0),
      totalCoinsAwarded: studentStats.reduce((sum, s) => sum + s.coins, 0),
    };

    res.json({ summary, students: studentStats, events: eventStats });
  }),
);
