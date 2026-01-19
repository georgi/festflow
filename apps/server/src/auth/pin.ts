import crypto from "node:crypto";

const KEYLEN = 32;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

function b64(buf: Buffer) {
  return buf.toString("base64");
}

function fromB64(value: string) {
  return Buffer.from(value, "base64");
}

export function hashPin(pin: string) {
  const salt = crypto.randomBytes(16);
  const derivedKey = crypto.scryptSync(pin, salt, KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P
  });

  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${b64(salt)}$${b64(derivedKey)}`;
}

export function verifyPin(pin: string, hash: string) {
  const parts = hash.split("$");
  if (parts.length !== 6) return false;
  const [algo, nStr, rStr, pStr, saltB64, keyB64] = parts;
  if (algo !== "scrypt") return false;

  const N = Number(nStr);
  const r = Number(rStr);
  const p = Number(pStr);
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false;

  const salt = fromB64(saltB64);
  const expected = fromB64(keyB64);
  const actual = crypto.scryptSync(pin, salt, expected.length, { N, r, p });
  return crypto.timingSafeEqual(actual, expected);
}

