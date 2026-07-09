"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Camera, Copy, Loader2, LogOut, Save } from "lucide-react";
import { Avatar } from "./Avatar";
import { ModelSelect } from "./ModelSelect";
import { compact } from "@/lib/format";
import { BASE_MODELS } from "@/lib/models";
import { createClient, isBrowserSupabaseConfigured } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

function subscribeOrigin() {
  return () => {};
}

function getOrigin() {
  return typeof window === "undefined" ? "" : window.location.origin;
}

function cleanHandle(value: string) {
  return value.replace(/^@+/, "").replace(/[^a-zA-Z0-9_]/g, "").toLowerCase().slice(0, 24);
}

export function ProfileEditor() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [company, setCompany] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [defaultModel, setDefaultModel] = useState(BASE_MODELS[0]);

  const configured = isBrowserSupabaseConfigured();
  const origin = useSyncExternalStore(subscribeOrigin, getOrigin, () => "");
  const publicUrl = handle && origin ? `${origin}/u/${handle}` : "";
  const joinUrl = profile?.joinCode && origin ? `${origin}/join/${profile.joinCode}` : "";

  useEffect(() => {
    let alive = true;
    fetch("/api/profile")
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Could not load profile.");
        return res.json();
      })
      .then((data) => {
        if (!alive) return;
        if (!data?.profile) {
          setNeedsAuth(true);
          return;
        }
        const next = data.profile as Profile;
        setProfile(next);
        setHandle(next.handle);
        setDisplayName(next.displayName);
        setCompany(next.company ?? "");
        setBio(next.bio ?? "");
        setWebsite(next.website ?? "");
        setAvatarUrl(next.avatarUrl ?? "");
        setDefaultModel(next.defaultModel ?? BASE_MODELS[0]);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load profile."))
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  async function copy(value: string, label: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1600);
  }

  async function uploadAvatar(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Sign in before uploading a profile picture.");

      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/avatar.${ext}`;
      const { data, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, {
          upsert: true,
          contentType: file.type || "image/jpeg",
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(data.path);
      setAvatarUrl(`${publicData.publicUrl}?v=${Date.now()}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not upload image.");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          handle,
          displayName,
          company,
          avatarUrl,
          bio,
          website,
          defaultModel,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save profile.");
      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (!configured) {
    return (
      <div className="glass flex flex-col gap-3 rounded-lg p-5 text-sm text-fog">
        <h1 className="font-display text-2xl font-bold text-bone">Supabase setup needed</h1>
        <p>Add the public Supabase URL and publishable key, then run the included migration.</p>
      </div>
    );
  }

  if (loading) return <div className="h-64 animate-pulse rounded-lg bg-ash" />;

  if (needsAuth) {
    return (
      <div className="glass flex flex-col gap-4 rounded-lg p-5">
        <h1 className="font-display text-2xl font-bold">Sign in to edit your profile</h1>
        <p className="text-sm text-fog">Accounts are backed by Supabase Auth, so your posts and profile stay tied to you.</p>
        <Link href="/login?next=/profile" className="inline-flex w-fit rounded-lg bg-bone px-4 py-2.5 text-sm font-bold text-ink">
          Sign in or create account
        </Link>
      </div>
    );
  }

  if (!profile) {
    return <div className="glass rounded-lg p-5 text-sm text-fog">{error || "Could not load profile."}</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex items-start gap-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(event) => uploadAvatar(event.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative rounded-full"
          aria-label="Upload profile picture"
        >
          <Avatar name={displayName || handle} handle={handle} src={avatarUrl} size={84} />
          <span className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full bg-bone text-ink">
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
          </span>
        </button>
        <div className="min-w-0 pt-1">
          <h1 className="truncate font-display text-2xl font-bold">{displayName || handle}</h1>
          <p className="truncate text-sm text-fog">@{handle}</p>
          {company ? <p className="mt-1 truncate text-sm text-fog">{company}</p> : null}
        </div>
      </section>

      <section className="glass grid grid-cols-2 gap-0 divide-x divide-line rounded-lg py-4 text-center sm:grid-cols-4">
        <Stat label="Total tokens" value={profile.totalTokens} />
        <Stat label="Burns" value={profile.posts} />
        <Stat label="Best day" value={profile.bestDayTokens} />
        <Stat label="Streak" value={profile.streak} />
      </section>

      <section className="glass flex flex-col gap-4 rounded-lg p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Handle">
            <div className="lit flex items-center rounded-lg bg-ink/70 px-3 py-3">
              <span className="text-fog">@</span>
              <input
                value={handle}
                onChange={(event) => setHandle(cleanHandle(event.target.value))}
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </Field>

          <Field label="Display name">
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="lit w-full rounded-lg bg-ink/70 px-3 py-3 text-sm outline-none"
            />
          </Field>
        </div>

        <Field label="Company">
          <input
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            className="lit w-full rounded-lg bg-ink/70 px-3 py-3 text-sm outline-none"
          />
        </Field>

        <Field label="Website">
          <input
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            className="lit w-full rounded-lg bg-ink/70 px-3 py-3 text-sm outline-none"
          />
        </Field>

        <Field label="Bio">
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value.slice(0, 220))}
            rows={3}
            className="lit w-full resize-none rounded-lg bg-ink/70 px-3 py-3 text-sm outline-none"
          />
        </Field>

        <Field label="Default model">
          <ModelSelect value={defaultModel} onChange={setDefaultModel} />
        </Field>

        {error ? <p className="rounded-lg bg-white/10 px-3 py-2 text-sm text-bone">{error}</p> : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={saving || handle.length < 3 || !displayName.trim()}
            onClick={save}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-bone px-4 py-3 text-sm font-bold text-ink disabled:opacity-40"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save profile
          </button>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-line px-4 py-3 text-sm font-semibold text-fog"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </section>

      <section className="glass flex flex-col gap-3 rounded-lg p-4">
        <h2 className="font-display text-lg font-bold">Share</h2>
        <ShareRow label="Public profile" value={publicUrl} onCopy={() => copy(publicUrl, "profile")} />
        <ShareRow label="Join link" value={joinUrl} onCopy={() => copy(joinUrl, "join")} />
        {copied ? <p className="text-xs text-fog">Copied {copied} link.</p> : null}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-dim">{label}</span>
      {children}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-2">
      <div className="font-display text-xl font-bold">{compact(value)}</div>
      <div className="text-[11px] uppercase tracking-wide text-dim">{label}</div>
    </div>
  );
}

function ShareRow({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-dim">{label}</div>
        <div className="truncate font-mono text-xs text-fog">{value || "Unavailable"}</div>
      </div>
      <button
        type="button"
        disabled={!value}
        onClick={onCopy}
        className="grid h-9 w-9 place-items-center rounded-lg border border-line text-fog disabled:opacity-40"
        aria-label={`Copy ${label}`}
      >
        <Copy size={15} />
      </button>
    </div>
  );
}
