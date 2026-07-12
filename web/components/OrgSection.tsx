"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Copy, Loader2 } from "lucide-react";

type Org = {
  id: string;
  name: string;
  slug: string;
  visibility: "public" | "private";
  joinCode: string;
  role: "owner" | "member";
};

/** Create, join, and manage your organization from the profile page. */
export function OrgSection() {
  const [orgs, setOrgs] = useState<Org[] | null>(null);
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => {
    fetch("/api/orgs")
      .then((r) => r.json())
      .then((d) => setOrgs(Array.isArray(d?.orgs) ? d.orgs : []))
      .catch(() => setOrgs([]));
  }, []);

  useEffect(load, [load]);

  async function call(url: string, body: object) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      load();
      setName("");
      setCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function setOrgVisibility(org: Org, next: "public" | "private") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orgs/${org.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not update visibility.");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update visibility.");
    } finally {
      setBusy(false);
    }
  }

  function copyInvite(org: Org) {
    const url = `${window.location.origin}/orgs/join/${org.joinCode}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (orgs === null) {
    return <div className="h-32 animate-pulse rounded-card bg-ash" />;
  }

  return (
    <section className="glass flex flex-col gap-4 rounded-card p-5">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold">
        <Building2 size={17} /> Organization
      </h2>

      {orgs.length > 0 ? (
        orgs.map((org) => (
          <div key={org.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/o/${org.slug}`}
                  className="truncate font-semibold text-bone underline-offset-4 hover:underline"
                >
                  {org.name}
                </Link>
                <div className="text-xs text-fog">
                  {org.role === "owner" ? "Owner" : "Member"} · {org.visibility}
                </div>
              </div>
              <button
                type="button"
                onClick={() => copyInvite(org)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-(--radius-control) border border-line px-3 py-1.5 text-xs font-semibold text-fog transition hover:border-smoke hover:text-bone"
              >
                <Copy size={13} /> {copied ? "Copied" : "Invite link"}
              </button>
            </div>

            {org.role === "owner" ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold uppercase tracking-wide text-dim">Visibility</span>
                {(["public", "private"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    disabled={busy || org.visibility === v}
                    onClick={() => setOrgVisibility(org, v)}
                    className={`rounded-full px-3 py-1 font-semibold capitalize transition ${
                      org.visibility === v
                        ? "bg-bone text-ink"
                        : "border border-line text-fog hover:text-bone"
                    }`}
                  >
                    {v}
                  </button>
                ))}
                <span className="text-dim">
                  {org.visibility === "private" ? "Only members can see it" : "Anyone can see it"}
                </span>
              </div>
            ) : null}
          </div>
        ))
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-dim">Create one</span>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 80))}
                placeholder="Organization name"
                className="lit w-full rounded-(--radius-control) bg-ink/70 px-3 py-2.5 text-sm outline-none placeholder:text-smoke"
              />
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value === "private" ? "private" : "public")}
                className="lit rounded-(--radius-control) bg-ink/70 px-3 py-2.5 text-sm outline-none"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
              <button
                type="button"
                disabled={busy || !name.trim()}
                onClick={() => call("/api/orgs", { name, visibility })}
                className="inline-flex items-center justify-center gap-2 rounded-(--radius-control) bg-bone px-4 py-2.5 text-sm font-bold text-ink disabled:opacity-40"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : null} Create
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-dim">
              Or join with a code
            </span>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Invite code"
                className="lit w-full rounded-(--radius-control) bg-ink/70 px-3 py-2.5 text-sm outline-none placeholder:text-smoke"
              />
              <button
                type="button"
                disabled={busy || !code.trim()}
                onClick={() => call("/api/orgs/join", { code })}
                className="rounded-(--radius-control) border border-line px-4 py-2.5 text-sm font-semibold text-fog transition hover:border-smoke hover:text-bone disabled:opacity-40"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      {error ? <p className="rounded-(--radius-control) bg-bone/10 px-3 py-2 text-sm text-bone">{error}</p> : null}
    </section>
  );
}
