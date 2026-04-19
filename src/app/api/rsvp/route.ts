import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    slug?: string | null;
    name?: string;
    attending?: string;
    message?: string;
  } | null;

  if (!body) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const attending = body.attending;
  const message = (body.message ?? "").trim();
  const slug = body.slug ? String(body.slug) : null;

  if (!name) {
    return Response.json({ error: "Name is required." }, { status: 400 });
  }
  if (name.length > 120) {
    return Response.json({ error: "Name is too long." }, { status: 400 });
  }
  if (attending !== "Yes" && attending !== "No") {
    return Response.json({ error: "Please select Yes or No." }, {
      status: 400,
    });
  }
  if (message.length > 2000) {
    return Response.json({ error: "Message is too long." }, { status: 400 });
  }

  const sb = getSupabaseAdmin();

  if (slug) {
    const found = await sb
      .from("invitees")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();
    if (found.error) {
      return Response.json({ error: "Server error." }, { status: 500 });
    }
    if (!found.data) {
      return Response.json({ error: "Invalid invitation link." }, {
        status: 400,
      });
    }
  }

  const ins = await sb
    .from("rsvps")
    .insert({ slug, name, attending, message })
    .select()
    .single();

  if (ins.error) {
    return Response.json({ error: ins.error.message }, { status: 500 });
  }

  return Response.json({ ok: true, rsvp: ins.data });
}
