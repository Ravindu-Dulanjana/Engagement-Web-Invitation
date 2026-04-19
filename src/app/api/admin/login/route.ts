import { NextRequest } from "next/server";
import { createSession, verifyCredentials } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = (await req.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
  };
  if (!username || !password) {
    return Response.json({ error: "Missing credentials." }, { status: 400 });
  }
  if (!verifyCredentials(username, password)) {
    return Response.json({ error: "Invalid username or password." }, {
      status: 401,
    });
  }
  await createSession();
  return Response.json({ ok: true });
}
