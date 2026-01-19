import crypto from "node:crypto";
import type { Request, Response } from "express";

type SessionPayload = {
  uid: string;
  exp: number;
  nonce: string;
};

export type SessionUser = {
  id: string;
};

function getSessionSecret() {
  return process.env.SESSION_SECRET ?? "dev-only-change-me";
}

function base64UrlEncode(buf: Buffer) {
  return buf
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlDecode(input: string) {
  const padded = input.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((input.length + 3) % 4);
  return Buffer.from(padded, "base64");
}

function sign(dataB64: string) {
  return base64UrlEncode(crypto.createHmac("sha256", getSessionSecret()).update(dataB64).digest());
}

function getCookie(req: Request, name: string) {
  const header = req.headers.cookie;
  if (!header) return null;
  const parts = header.split(";").map((p) => p.trim());
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx);
    const v = part.slice(idx + 1);
    if (k === name) return decodeURIComponent(v);
  }
  return null;
}

const COOKIE_NAME = "ff_session";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function setSessionCookie(res: Response, user: SessionUser) {
  const payload: SessionPayload = {
    uid: user.id,
    exp: Date.now() + ONE_DAY_MS,
    nonce: crypto.randomBytes(12).toString("hex")
  };

  const dataB64 = base64UrlEncode(Buffer.from(JSON.stringify(payload), "utf8"));
  const token = `${dataB64}.${sign(dataB64)}`;

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_DAY_MS,
    path: "/"
  });
}

export function clearSessionCookie(res: Response) {
  res.cookie(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/"
  });
}

export function readSessionUser(req: Request): SessionUser | null {
  const token = getCookie(req, COOKIE_NAME);
  if (!token) return null;
  const [dataB64, sig] = token.split(".");
  if (!dataB64 || !sig) return null;
  if (sign(dataB64) !== sig) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(dataB64).toString("utf8")) as SessionPayload;
    if (typeof payload.uid !== "string") return null;
    if (typeof payload.exp !== "number") return null;
    if (payload.exp < Date.now()) return null;
    return { id: payload.uid };
  } catch {
    return null;
  }
}

