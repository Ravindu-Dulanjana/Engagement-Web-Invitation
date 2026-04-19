import { notFound } from "next/navigation";
import Invite from "@/app/Invite";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function InviteePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sb = getSupabaseAdmin();
  const row = await sb
    .from("invitees")
    .select("name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (row.error || !row.data) notFound();

  return <Invite downloadSlug={row.data.slug} inviteeName={row.data.name} />;
}
