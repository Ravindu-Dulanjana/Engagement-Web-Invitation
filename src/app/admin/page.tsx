import { redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import { getSupabaseAdmin, Invitee, Rsvp } from "@/lib/supabase";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isLoggedIn())) redirect("/admin/login");

  let invitees: Invitee[] = [];
  let rsvps: Rsvp[] = [];
  let loadError: string | null = null;
  try {
    const sb = getSupabaseAdmin();
    const [inv, rs] = await Promise.all([
      sb
        .from("invitees")
        .select("id, slug, name, pdf_path, created_at")
        .order("created_at", { ascending: false }),
      sb
        .from("rsvps")
        .select("id, slug, name, attending, message, created_at")
        .order("created_at", { ascending: false }),
    ]);
    if (inv.error) throw inv.error;
    if (rs.error) throw rs.error;
    invitees = (inv.data as Invitee[]) ?? [];
    rsvps = (rs.data as Rsvp[]) ?? [];
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load data from Supabase.";
  }

  return (
    <AdminDashboard
      initialInvitees={invitees}
      initialRsvps={rsvps}
      loadError={loadError}
    />
  );
}
