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
    .select("name, slug, title")
    .eq("slug", slug)
    .maybeSingle();
  if (row.error || !row.data) notFound();

  const title =
    row.data.title === "Mr" ||
    row.data.title === "Mrs" ||
    row.data.title === "Miss"
      ? row.data.title
      : null;

  const latest = await sb
    .from("rsvps")
    .select("attending, message, name, created_at")
    .eq("slug", slug)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const existingRsvp =
    latest.data && (latest.data.attending === "Yes" || latest.data.attending === "No")
      ? {
          attending: latest.data.attending as "Yes" | "No",
          message: latest.data.message ?? "",
          name: latest.data.name ?? row.data.name,
        }
      : undefined;

  return (
    <Invite
      downloadSlug={row.data.slug}
      inviteeName={row.data.name}
      inviteeTitle={title}
      existingRsvp={existingRsvp}
    />
  );
}
