"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Invitee } from "@/lib/supabase";

function fmt(dt: string) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt;
  }
}

export default function AdminDashboard({
  initial,
  loadError,
}: {
  initial: Invitee[];
  loadError: string | null;
}) {
  const router = useRouter();
  const [invitees, setInvitees] = useState<Invitee[]>(initial);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!name.trim() || !file) {
      setErr("Name and PDF are both required.");
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.append("name", name.trim());
      body.append("pdf", file);
      const res = await fetch("/api/admin/invitees", {
        method: "POST",
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Upload failed.");
        return;
      }
      setInvitees((prev) => [data.invitee as Invitee, ...prev]);
      setName("");
      setFile(null);
      (document.getElementById("pdf-input") as HTMLInputElement | null)?.value &&
        ((document.getElementById("pdf-input") as HTMLInputElement).value = "");
      setMsg(`Added ${data.invitee.name}.`);
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, inviteeName: string) {
    if (!confirm(`Delete invitation for ${inviteeName}?`)) return;
    const res = await fetch(`/api/admin/invitees/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Delete failed.");
      return;
    }
    setInvitees((prev) => prev.filter((i) => i.id !== id));
  }

  async function copyLink(slug: string, id: string) {
    const url = `${window.location.origin}/i/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId((x) => (x === id ? null : x)), 1800);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <div className="min-h-screen stage-bg px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <h1
            className="gold-gradient-text py-1"
            style={{
              fontFamily: "var(--font-script)",
              fontSize: "2.25rem",
              lineHeight: 1.2,
            }}
          >
            Admin
          </h1>
          <button onClick={logout} className="btn-outline text-sm">
            Sign out
          </button>
        </header>

        {loadError && (
          <div className="mb-6 p-4 rounded-md border border-red-400/40 bg-red-950/30 text-red-200 text-sm">
            <strong>Supabase not reachable:</strong> {loadError}
            <div className="mt-2 text-cream/70">
              Fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in{" "}
              <code>.env.local</code>, then restart{" "}
              <code>npm run dev</code>. See README for full setup.
            </div>
          </div>
        )}

        <section className="p-6 rounded-xl border border-gold/30 bg-navy/60 mb-10">
          <h2 className="text-xs tracking-[0.3em] uppercase text-gold/80 mb-4">
            Add invitee
          </h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs tracking-[0.25em] uppercase text-gold/80 mb-1">
                Invitee name
              </label>
              <input
                className="field-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kasun Perera"
                required
              />
            </div>
            <div>
              <label className="block text-xs tracking-[0.25em] uppercase text-gold/80 mb-1">
                Invitation PDF
              </label>
              <input
                id="pdf-input"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-cream/80 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gold/90 file:text-navy hover:file:brightness-110"
                required
              />
            </div>
            {err && <p className="text-sm text-red-300/90">{err}</p>}
            {msg && <p className="text-sm text-emerald-300/90">{msg}</p>}
            <button
              type="submit"
              disabled={busy}
              className="btn-gold disabled:opacity-50"
            >
              {busy ? "Uploading…" : "Add invitee"}
            </button>
          </form>
        </section>

        <section>
          <h2 className="text-xs tracking-[0.3em] uppercase text-gold/80 mb-4">
            Invitees ({invitees.length})
          </h2>
          {invitees.length === 0 ? (
            <p className="text-cream/60 text-sm italic">
              No invitees yet. Add one above.
            </p>
          ) : (
            <ul className="space-y-3">
              {invitees.map((i) => (
                <li
                  key={i.id}
                  className="p-4 rounded-md border border-gold/20 bg-navy/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-lg text-cream">{i.name}</div>
                    <div className="text-xs text-cream/50 mt-0.5 truncate">
                      /i/{i.slug} · {fmt(i.created_at)}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => copyLink(i.slug, i.id)}
                      className="btn-outline text-xs"
                    >
                      {copiedId === i.id ? "Copied ✓" : "Copy link"}
                    </button>
                    <a
                      href={`/i/${i.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline text-xs"
                    >
                      Preview
                    </a>
                    <button
                      onClick={() => remove(i.id, i.name)}
                      className="btn-outline text-xs border-red-400/40 text-red-300 hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
