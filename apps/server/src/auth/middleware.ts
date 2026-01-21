import type { Request, Response } from "express";
import { prisma } from "../db";
import { readSessionUser } from "./session";

export type AuthUser = {
  id: string;
  name: string;
  roles: ("WAITER" | "KITCHEN" | "BAR" | "CASHIER" | "ADMIN")[];
};

export async function getAuthUser(req: Request): Promise<AuthUser | null> {
  const session = readSessionUser(req);
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { roles: true }
  });
  if (!user || !user.active) return null;
  return {
    id: user.id,
    name: user.name,
    roles: user.roles.map((r) => r.role)
  };
}

export async function requireAuth(req: Request, res: Response): Promise<AuthUser | null> {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return user;
}

// Check if user's roles intersect with allowed roles
function hasRoleAccess(userRoles: AuthUser["roles"], allowedRoles: AuthUser["roles"][number][]): boolean {
  return userRoles.some((role) => allowedRoles.includes(role));
}

export async function requireRole(
  req: Request,
  res: Response,
  roles: AuthUser["roles"][number][]
): Promise<AuthUser | null> {
  const user = await requireAuth(req, res);
  if (!user) return null;
  if (!hasRoleAccess(user.roles, roles)) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }
  return user;
}

