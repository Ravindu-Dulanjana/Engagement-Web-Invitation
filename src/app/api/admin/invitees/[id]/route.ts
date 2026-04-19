import { NextRequest } from "next/server";
import { isLoggedIn } from "@/lib/auth";
import { BUCKET, getSupabaseAdmin } from "@/lib/supabase";

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await isLoggedIn())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const sb = getSupabaseAdmin();

  const found = await sb
    .from("invitees")
    .select("pdf_path")
    .eq("id", id)
    .maybeSingle();
  if (found.error) {
    return Response.json({ error: found.error.message }, { status: 500 });
  }
  if (!found.data) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await sb.storage.from(BUCKET).remove([found.data.pdf_path]);
  const del = await sb.from("invitees").delete().eq("id", id);
  if (del.error) {
    return Response.json({ error: del.error.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
