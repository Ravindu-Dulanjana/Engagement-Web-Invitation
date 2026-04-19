import { NextRequest } from "next/server";
import { generateSlug, isLoggedIn } from "@/lib/auth";
import { BUCKET, getSupabaseAdmin, Invitee } from "@/lib/supabase";

const MAX_BYTES = 15 * 1024 * 1024;

export async function GET() {
  if (!(await isLoggedIn())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("invitees")
    .select("id, slug, name, pdf_path, created_at")
    .order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ invitees: data as Invitee[] });
}

export async function POST(req: NextRequest) {
  if (!(await isLoggedIn())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Invalid form data." }, { status: 400 });
  }

  const name = String(form.get("name") ?? "").trim();
  const file = form.get("pdf");
  if (!name) {
    return Response.json({ error: "Name is required." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "PDF file is required." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "PDF is too large (max 15 MB)." }, {
      status: 413,
    });
  }
  if (
    file.type &&
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    return Response.json({ error: "File must be a PDF." }, { status: 400 });
  }

  const sb = getSupabaseAdmin();
  const slug = generateSlug();
  const pdfPath = `${slug}.pdf`;

  const bytes = Buffer.from(await file.arrayBuffer());
  const up = await sb.storage.from(BUCKET).upload(pdfPath, bytes, {
    contentType: "application/pdf",
    upsert: false,
  });
  if (up.error) {
    return Response.json({ error: `Upload failed: ${up.error.message}` }, {
      status: 500,
    });
  }

  const ins = await sb
    .from("invitees")
    .insert({ slug, name, pdf_path: pdfPath })
    .select()
    .single();
  if (ins.error) {
    await sb.storage.from(BUCKET).remove([pdfPath]);
    return Response.json({ error: `DB insert failed: ${ins.error.message}` }, {
      status: 500,
    });
  }

  return Response.json({ invitee: ins.data });
}
