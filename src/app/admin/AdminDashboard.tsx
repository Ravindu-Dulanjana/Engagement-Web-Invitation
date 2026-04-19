"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Invitee, Rsvp } from "@/lib/supabase";

function fmt(dt: string) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt;
  }
}

function rsvpKey(r: Rsvp): string {
  return r.slug
    ? `slug:${r.slug}`
    : `name:${r.name.trim().toLowerCase()}`;
}

type RsvpGroup = {
  key: string;
  latest: Rsvp;
  history: Rsvp[];
  slug: string | null;
  displayName: string;
  isOrphanSlug: boolean;
};

function groupRsvps(
  rsvps: Rsvp[],
  slugToInviteeName: Map<string, string>,
): RsvpGroup[] {
  const map = new Map<string, Rsvp[]>();
  for (const r of rsvps) {
    const k = rsvpKey(r);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(r);
  }
  const groups: RsvpGroup[] = [];
  for (const [key, rows] of map) {
    rows.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    const latest = rows[0];
    const inviteeName = latest.slug ? slugToInviteeName.get(latest.slug) : null;
    const displayName = inviteeName ?? latest.name;
    const isOrphanSlug = Boolean(latest.slug) && !inviteeName;
    groups.push({
      key,
      latest,
      history: rows,
      slug: latest.slug,
      displayName,
      isOrphanSlug,
    });
  }
  groups.sort(
    (a, b) =>
      new Date(b.latest.created_at).getTime() -
      new Date(a.latest.created_at).getTime(),
  );
  return groups;
}

export default function AdminDashboard({
  initialInvitees,
  initialRsvps,
  loadError,
}: {
  initialInvitees: Invitee[];
  initialRsvps: Rsvp[];
  loadError: string | null;
}) {
  const router = useRouter();
  const [invitees, setInvitees] = useState<Invitee[]>(initialInvitees);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const slugToInviteeName = useMemo(
    () => new Map(invitees.map((i) => [i.slug, i.name] as const)),
    [invitees],
  );
  const rsvpGroups = useMemo(
    () => groupRsvps(initialRsvps, slugToInviteeName),
    [initialRsvps, slugToInviteeName],
  );
  const counts = useMemo(() => {
    const yes = rsvpGroups.filter((g) => g.latest.attending === "Yes").length;
    const no = rsvpGroups.filter((g) => g.latest.attending === "No").length;
    return { yes, no, total: rsvpGroups.length };
  }, [rsvpGroups]);

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
      const el = document.getElementById("pdf-input") as HTMLInputElement | null;
      if (el) el.value = "";
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
          <div className="flex gap-2">
            <button
              onClick={() => router.refresh()}
              className="btn-outline text-sm"
              title="Refresh data"
            >
              Refresh
            </button>
            <button onClick={logout} className="btn-outline text-sm">
              Sign out
            </button>
          </div>
        </header>

        {loadError && (
          <div className="mb-6 p-4 rounded-md border border-red-400/40 bg-red-950/30 text-red-200 text-sm">
            <strong>Supabase not reachable:</strong> {loadError}
            <div className="mt-2 text-cream/70">
              Check your env vars in <code>.env.local</code>, and that both the{" "}
              <code>invitees</code> and <code>rsvps</code> tables exist. See
              README for full setup.
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

        <section className="mb-12">
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

        <section>
          <div className="flex items-end justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-xs tracking-[0.3em] uppercase text-gold/80">
              RSVPs ({counts.total} {counts.total === 1 ? "person" : "people"})
            </h2>
            {counts.total > 0 && (
              <div className="text-xs text-cream/70 tracking-wider">
                <span className="text-emerald-300">{counts.yes} attending</span>
                <span className="text-cream/40"> · </span>
                <span className="text-red-300/90">{counts.no} declining</span>
              </div>
            )}
          </div>
          {rsvpGroups.length === 0 ? (
            <p className="text-cream/60 text-sm italic">
              No RSVPs yet. Responses submitted via the invitation will appear
              here.
            </p>
          ) : (
            <ul className="space-y-3">
              {rsvpGroups.map((g) => {
                const isOpen = expanded === g.key;
                const hasHistory = g.history.length > 1;
                const yesTone =
                  g.latest.attending === "Yes"
                    ? "border-emerald-400/40 text-emerald-300 bg-emerald-400/10"
                    : "border-red-400/40 text-red-300 bg-red-400/10";
                return (
                  <li
                    key={g.key}
                    className="rounded-md border border-gold/20 bg-navy/40 overflow-hidden"
                  >
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-lg text-cream truncate">
                            {g.displayName}
                          </span>
                          <span
                            className={`text-[10px] tracking-[0.25em] uppercase px-2 py-0.5 rounded-full border ${yesTone}`}
                          >
                            {g.latest.attending === "Yes" ? "Attending" : "Declining"}
                          </span>
                          {g.isOrphanSlug && (
                            <span className="text-[10px] tracking-[0.25em] uppercase px-2 py-0.5 rounded-full border border-amber-400/40 text-amber-300">
                              Invitee deleted
                            </span>
                          )}
                          {g.slug && !g.isOrphanSlug && (
                            <a
                              href={`/i/${g.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-cream/50 hover:text-gold/90 truncate"
                            >
                              /i/{g.slug}
                            </a>
                          )}
                        </div>
                        {g.latest.name.trim().toLowerCase() !==
                          g.displayName.trim().toLowerCase() && (
                          <div className="text-xs text-cream/65 mt-1">
                            Submitted as:{" "}
                            <span className="text-cream/85">{g.latest.name}</span>
                          </div>
                        )}
                        <div className="text-xs text-cream/55 mt-1">
                          Latest: {fmt(g.latest.created_at)}
                          {hasHistory &&
                            ` · ${g.history.length} submissions`}
                        </div>
                        {g.latest.message && (
                          <p className="mt-2 text-sm text-cream/85 italic whitespace-pre-wrap">
                            “{g.latest.message}”
                          </p>
                        )}
                      </div>
                      {hasHistory && (
                        <button
                          onClick={() => setExpanded(isOpen ? null : g.key)}
                          className="btn-outline text-xs self-start sm:self-auto"
                        >
                          {isOpen ? "Hide history" : "View history"}
                        </button>
                      )}
                    </div>
                    {isOpen && hasHistory && (
                      <div className="px-4 pb-4 border-t border-gold/10">
                        <ol className="mt-3 space-y-3">
                          {g.history.map((r, idx) => (
                            <li
                              key={r.id}
                              className="pl-4 border-l border-gold/20"
                            >
                              <div className="text-xs text-cream/55 flex items-center gap-2 flex-wrap">
                                <span>{fmt(r.created_at)}</span>
                                <span
                                  className={`text-[10px] tracking-[0.25em] uppercase px-1.5 py-0.5 rounded-full border ${
                                    r.attending === "Yes"
                                      ? "border-emerald-400/40 text-emerald-300"
                                      : "border-red-400/40 text-red-300"
                                  }`}
                                >
                                  {r.attending}
                                </span>
                                {idx === 0 && (
                                  <span className="text-[10px] tracking-[0.25em] uppercase text-gold/80">
                                    Latest
                                  </span>
                                )}
                              </div>
                              {r.name.trim().toLowerCase() !==
                                g.displayName.trim().toLowerCase() && (
                                <div className="text-xs text-cream/65 mt-1">
                                  Submitted as: {r.name}
                                </div>
                              )}
                              {r.message && (
                                <p className="mt-1 text-sm text-cream/80 italic whitespace-pre-wrap">
                                  “{r.message}”
                                </p>
                              )}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
