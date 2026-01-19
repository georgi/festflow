import type { Request, Response } from "express";
import { prisma } from "../db";
import { readSessionUser } from "./session";

export type AuthUser = {
  id: string;
  name: string;
  role: "WAITER" | "KITCHEN" | "BAR" | "ADMIN";
};

export async function getAuthUser(req: Request): Promise<AuthUser | null> {
  const session = readSessionUser(req);
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || !user.active) return null;
  return { id: user.id, name: user.name, role: user.role };
}

export async function requireAuth(req: Request, res: Response): Promise<AuthUser | null> {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return user;
}

export async function requireRole(
  req: Request,
  res: Response,
  roles: AuthUser["role"][]
): Promise<AuthUser | null> {
  const user = await requireAuth(req, res);
  if (!user) return null;
  if (!roles.includes(user.role)) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }
  return user;
}

