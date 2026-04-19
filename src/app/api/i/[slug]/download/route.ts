import { NextRequest } from "next/server";
import { BUCKET, getSupabaseAdmin } from "@/lib/supabase";

function safeFilename(name: string): string {
  return (
    name
      .replace(/[^a-zA-Z0-9 \-_]/g, "")
      .trim()
      .replace(/\s+/g, "-") || "invitation"
  );
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const sb = getSupabaseAdmin();

  const row = await sb
    .from("invitees")
    .select("name, pdf_path")
    .eq("slug", slug)
    .maybeSingle();
  if (row.error) {
    return new Response("Server error", { status: 500 });
  }
  if (!row.data) {
    return new Response("Not found", { status: 404 });
  }

  const dl = await sb.storage.from(BUCKET).download(row.data.pdf_path);
  if (dl.error || !dl.data) {
    return new Response("File unavailable", { status: 500 });
  }

  const filename = `${safeFilename(row.data.name)}-engagement-invitation.pdf`;
  return new Response(dl.data, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
