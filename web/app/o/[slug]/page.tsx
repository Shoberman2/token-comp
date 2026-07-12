import Link from "next/link";
import { Building2, Lock } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { BurnCard } from "@/components/BurnCard";
import { PageHeader } from "@/components/PageHeader";
import { compact } from "@/lib/format";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Burn } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `${slug} — Burnt` };
}

export default async function OrgPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!isSupabaseConfigured()) {
    return <EmptyState title="Supabase setup needed" sub="Configure the backend to use organizations." />;
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return <EmptyState title="Supabase setup needed" sub="Configure the backend to use organizations." />;
  }

  // RLS hides private orgs from non-members, so this doubles as the gate.
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug, visibility, created_at")
    .eq("slug", slug)
    .maybeSingle();

  if (!org) {
    return (
      <EmptyState
        title="Private or unknown organization"
        sub="This organization doesn't exist, or it's private and you're not a member."
      />
    );
  }

  const { data: memberRows } = await supabase
    .from("organization_members")
    .select("role, profiles(id, handle, display_name, avatar_url)")
    .eq("org_id", org.id);

  const members = (memberRows ?? [])
    .filter((m) => m.profiles)
    .map((m) => ({
      role: m.role,
      id: m.profiles!.id,
      handle: m.profiles!.handle,
      displayName: m.profiles!.display_name,
      avatarUrl: m.profiles!.avatar_url,
    }));

  const memberIds = members.map((m) => m.id);
  let burns: Burn[] = [];
  if (memberIds.length > 0) {
    const { data: burnRows } = await supabase
      .from("burns")
      .select("*")
      .in("user_id", memberIds)
      .order("created_at", { ascending: false })
      .limit(50);

    const byId = new Map(members.map((m) => [m.id, m]));
    burns = (burnRows ?? []).map((row) => {
      const author = byId.get(row.user_id);
      return {
        id: row.id,
        userId: row.user_id,
        handle: author?.handle ?? "unknown",
        displayName: author?.displayName ?? "Unknown user",
        avatar: "",
        avatarUrl: author?.avatarUrl ?? undefined,
        tokens: Number(row.tokens),
        cost: row.cost == null ? undefined : Number(row.cost),
        model: row.model || undefined,
        imageUrl: row.image_url,
        caption: row.caption ?? undefined,
        createdAt: row.created_at,
      };
    });
  }

  const totals = new Map<string, number>();
  for (const b of burns) totals.set(b.handle, (totals.get(b.handle) ?? 0) + b.tokens);
  const ranked = [...members].sort(
    (a, b) => (totals.get(b.handle) ?? 0) - (totals.get(a.handle) ?? 0)
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={org.name}
        sub={`Organization · ${org.visibility === "private" ? "Private" : "Public"} · ${members.length} member${members.length === 1 ? "" : "s"}`}
      />

      <section className="glass flex flex-col gap-1 rounded-card p-2">
        {ranked.map((m, i) => (
          <Link
            key={m.id}
            href={`/u/${m.handle}`}
            className="flex items-center gap-3 rounded-(--radius-control) px-3 py-2.5 transition hover:bg-bone/5"
          >
            <span className="w-5 text-center font-display text-sm font-bold text-dim tabular">
              {i + 1}
            </span>
            <Avatar name={m.displayName} handle={m.handle} src={m.avatarUrl} size={32} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-bone">{m.displayName}</div>
              <div className="truncate text-xs text-fog">
                @{m.handle}
                {m.role === "owner" ? " · owner" : ""}
              </div>
            </div>
            <div className="font-display text-sm font-bold silver">
              {compact(totals.get(m.handle) ?? 0)}
            </div>
          </Link>
        ))}
      </section>

      {burns.length === 0 ? (
        <EmptyState title="No burns yet" sub="Posts from members will show up here." />
      ) : (
        <div className="flex flex-col gap-6">
          {burns.map((b, i) => (
            <BurnCard key={b.id} burn={b} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="glass mt-2 flex flex-col items-center gap-3 rounded-card px-6 py-16 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full border border-line text-fog">
        {title.startsWith("Private") ? <Lock size={20} /> : <Building2 size={20} />}
      </span>
      <div>
        <p className="font-display text-lg font-bold">{title}</p>
        <p className="mt-1 text-sm text-fog">{sub}</p>
      </div>
      <Link href="/" className="text-sm font-semibold text-bone underline underline-offset-4">
        Back to the feed
      </Link>
    </div>
  );
}
