import { Router, type RequestHandler } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const usersRouter = Router();

const asyncHandler = (fn: RequestHandler): RequestHandler => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Powers the leaderboard, which tracks student participation only —
// mentors/managers don't earn coins so they're excluded.
usersRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      where: { role: Role.MEMBER },
      select: { id: true, name: true, role: true, coins: true },
      orderBy: { coins: "desc" },
    });
    res.json(users);
  }),
);
