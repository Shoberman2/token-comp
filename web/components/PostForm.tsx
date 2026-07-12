"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, Loader2, Plus, X } from "lucide-react";
import { motion } from "motion/react";
import { compact, estimateCost, usd } from "@/lib/format";
import { BASE_MODELS } from "@/lib/models";
import type { Burn, Profile } from "@/lib/types";
import { ModelSelect } from "./ModelSelect";

export function PostForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [tokens, setTokens] = useState("");
  const [model, setModel] = useState(BASE_MODELS[0]);
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          setAuthRequired(true);
          return;
        }
        const next = data.profile as Profile;
        setProfile(next);
        setModel(next.defaultModel || BASE_MODELS[0]);
      })
      .catch((caught) => {
        if (alive) setError(caught instanceof Error ? caught.message : "Could not load profile.");
      })
      .finally(() => {
        if (alive) setCheckingAuth(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function pickFile(f: File | null) {
    if (!f) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
    if (!allowed.includes(f.type)) {
      setError("Use a JPG, PNG, WebP, GIF, HEIC, or HEIF image.");
      return;
    }
    if (f.size > 12 * 1024 * 1024) {
      setError("Image is too large (max 12MB).");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  }

  const tokenNum = Number(tokens.replace(/[, ]/g, ""));
  const validTokens = Number.isFinite(tokenNum) && tokenNum > 0;
  const canSubmit = !!profile && !!file && validTokens && !submitting;

  async function submit() {
    if (!profile) return setError("Sign in before posting.");
    if (!file) return setError("Add a screenshot of your usage first.");
    if (!validTokens) return setError("Enter how many tokens you used.");

    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("tokens", String(Math.round(tokenNum)));
      fd.append("model", model);
      if (caption.trim()) fd.append("caption", caption.trim());

      const res = await fetch("/api/burns", { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Something went wrong.");
      }
      const data = (await res.json()) as { burn: Burn };
      router.push(`/b/${data.burn.id}?posted=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  if (checkingAuth) {
    return <div className="h-64 animate-pulse rounded-card bg-ash" />;
  }

  if (authRequired) {
    return (
      <div className="glass flex flex-col gap-4 rounded-card p-5">
        <h2 className="font-display text-xl font-bold">Sign in to post</h2>
        <p className="text-sm text-fog">Burns are attached to real Supabase accounts with profile information.</p>
        <Link href="/login?next=/post" className="inline-flex w-fit rounded-(--radius-control) bg-bone px-4 py-2.5 text-sm font-bold text-ink">
          Sign in or create account
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
      />

      {preview ? (
        <div className="glass relative overflow-hidden rounded-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Your usage screenshot" className="max-h-[54vh] w-full object-contain" />
          <button
            onClick={() => {
              setFile(null);
              setPreview(null);
            }}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-(--radius-control) bg-black/70 text-white backdrop-blur"
            aria-label="Remove image"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="glass lit flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-card text-center transition active:scale-[0.99]"
        >
          <div className="grid h-14 w-14 place-items-center rounded-(--radius-control) bg-bone text-ink">
            <Camera size={28} />
          </div>
          <div className="font-display text-lg font-bold">Upload usage screenshot</div>
          <div className="flex items-center gap-1.5 text-xs text-fog">
            <ImagePlus size={14} /> Take a photo or choose an image
          </div>
        </button>
      )}

      <Field label="Tokens used today" required>
        <div className="glass lit flex items-center rounded-(--radius-control) px-4 py-3">
          <input
            inputMode="numeric"
            value={tokens}
            onChange={(e) => setTokens(e.target.value.replace(/[^0-9,]/g, ""))}
            placeholder="42,000,000"
            className="w-full bg-transparent font-display text-2xl font-bold tabular outline-none placeholder:text-smoke"
          />
        </div>
        {validTokens ? (
          <p className="mt-1.5 text-xs text-fog">
            <span className="font-semibold text-bone">{compact(tokenNum)}</span> tokens, about {usd(estimateCost(tokenNum))}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-fog">Use the number from your usage screen.</p>
        )}
      </Field>

      <Field label="AI model">
        <ModelSelect value={model} onChange={setModel} />
      </Field>

      <Field label="Caption">
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value.slice(0, 180))}
          rows={2}
          placeholder="What were you building?"
          className="glass lit w-full resize-none rounded-(--radius-control) px-4 py-3 text-sm outline-none placeholder:text-smoke"
        />
      </Field>

      {error ? (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-(--radius-control) bg-bone/10 px-4 py-3 text-sm text-bone"
        >
          {error}
        </motion.p>
      ) : null}

      <button
        disabled={!canSubmit}
        onClick={submit}
        className="flex items-center justify-center gap-2 rounded-(--radius-control) bg-bone py-4 font-display text-base font-bold text-ink transition active:scale-[0.99] disabled:opacity-40"
      >
        {submitting ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Posting
          </>
        ) : (
          <>
            <Plus size={18} strokeWidth={2.6} /> Post usage
          </>
        )}
      </button>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-dim">
          {label}
          {required ? <span className="text-bone"> *</span> : null}
        </span>
      </div>
      {children}
    </div>
  );
}
