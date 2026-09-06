import { Router, type RequestHandler } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AUTH_COOKIE_NAME, hashPassword, signToken, verifyPassword } from "../lib/auth.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

const asyncHandler = (fn: RequestHandler): RequestHandler => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const isProduction = process.env.NODE_ENV === "production";

// Cross-site cookies (frontend and backend on different domains in production)
// require SameSite=None + Secure. Locally over http://localhost, Secure would
// block the cookie entirely, so dev stays on Lax + non-secure.
const cookieOptions = {
  httpOnly: true,
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
  secure: isProduction,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const userPublicFields = { id: true, name: true, email: true, role: true, coins: true } as const;

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body ?? {};

    if (typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "Name is required" });
      return;
    }
    if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400).json({ error: "A valid email is required" });
      return;
    }
    if (typeof password !== "string" || password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }
    const requestedRole = role === "MENTOR" || role === "MANAGER" ? role : Role.MEMBER;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name: name.trim(), email, passwordHash, role: requestedRole },
      select: userPublicFields,
    });

    const token = signToken({ userId: user.id, role: user.role });
    res.cookie(AUTH_COOKIE_NAME, token, cookieOptions);
    res.status(201).json(user);
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = signToken({ userId: user.id, role: user.role });
    res.cookie(AUTH_COOKIE_NAME, token, cookieOptions);
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, coins: user.coins });
  }),
);

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, { httpOnly: cookieOptions.httpOnly, sameSite: cookieOptions.sameSite, secure: cookieOptions.secure });
  res.status(204).end();
});

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: userPublicFields,
    });
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    res.json(user);
  }),
);
