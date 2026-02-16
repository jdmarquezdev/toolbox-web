import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "./env";

type SessionPayload = {
  email: string;
  exp: number;
};

function sign(value: string): string {
  return createHmac("sha256", env.SESSION_SECRET).update(value).digest("base64url");
}

export function createSessionToken(email: string): string {
  const payload: SessionPayload = {
    email,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 14
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string): boolean {
  const [body, signature] = token.split(".");
  if (!body || !signature) {
    return false;
  }

  const expected = sign(body);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}
