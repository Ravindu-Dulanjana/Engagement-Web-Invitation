import { redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import { getSupabaseAdmin, Invitee } from "@/lib/supabase";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isLoggedIn())) redirect("/admin/login");

  let initial: Invitee[] = [];
  let loadError: string | null = null;
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("invitees")
      .select("id, slug, name, pdf_path, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    initial = (data as Invitee[]) ?? [];
  } catch (e) {
    loadError =
      e instanceof Error ? e.message : "Could not load invitees from Supabase.";
  }

  return <AdminDashboard initial={initial} loadError={loadError} />;
}
