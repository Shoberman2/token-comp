import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { mergeModels, normalizeModelName } from "./models";
import {
  followCounts,
  getFollowing,
  getUser,
  getUserById,
  listUsers,
  normalizeHandle,
  upsertUser,
} from "./social";
import { createServerSupabaseClient, isSupabaseConfigured } from "./supabase/server";
import type { ServerSupabaseClient } from "./supabase/server";
import type { Database } from "./supabase/types";
import type { Burn, Me, Profile, Range, RankEntry, Suggestion } from "./types";
import { rangeWindowMs } from "./types";

const DATA_DIR = process.env.VERCEL ? "/tmp/burnt-data" : path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "burns.json");

type BurnRow = Database["public"]["Tables"]["burns"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type NewBurn = {
  userId?: string;
  handle?: string;
  displayName?: string;
  avatar?: string;
  tokens: number;
  cost?: number;
  model?: string;
  imageUrl: string;
  caption?: string;
};

/* ------------------------------ JSON backend ------------------------------ */

async function readJson(): Promise<Burn[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Burn[];
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* not created yet */
  }

  return [];
}

async function writeJson(burns: Burn[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(burns, null, 2));
}

/* ----------------------------- Supabase helpers --------------------------- */

function rowToBurn(row: BurnRow, profile?: ProfileRow | null): Burn {
  return {
    id: row.id,
    userId: row.user_id,
    handle: profile?.handle ?? "unknown",
    displayName: profile?.display_name ?? "Unknown user",
    avatar: "",
    avatarUrl: profile?.avatar_url ?? undefined,
    company: profile?.company ?? undefined,
    tokens: Number(row.tokens),
    cost: row.cost == null ? undefined : Number(row.cost),
    model: row.model || undefined,
    imageUrl: row.image_url,
    caption: row.caption ?? undefined,
    createdAt: row.created_at,
  };
}

async function profilesById(ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  const profiles = new Map<string, ProfileRow>();
  if (uniqueIds.length === 0) return profiles;

  const supabase = await createServerSupabaseClient();
  if (!supabase) return profiles;

  const { data, error } = await supabase.from("profiles").select("*").in("id", uniqueIds);
  if (error) throw error;

  for (const profileRow of data ?? []) {
    profiles.set(profileRow.id, profileRow);
  }

  return profiles;
}

/* --------------------------------- API ------------------------------------ */

export async function listBurns(limit = 200): Promise<Burn[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("burns")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    const profileMap = await profilesById((data ?? []).map((b) => b.user_id));
    return (data ?? []).map((b) => rowToBurn(b, profileMap.get(b.user_id)));
  }

  const all = await readJson();
  return [...all].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, limit);
}

/** A single public burn. Burn rows and their author profiles are readable under
 * the public RLS policies, so shared links do not require an account. */
export async function getBurn(id: string): Promise<Burn | null> {
  const burnId = id.trim();
  if (!burnId) return null;

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase.from("burns").select("*").eq("id", burnId).maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const profileMap = await profilesById([data.user_id]);
    return rowToBurn(data, profileMap.get(data.user_id));
  }

  const burns = await readJson();
  return burns.find((burn) => burn.id === burnId) ?? null;
}

export async function createBurn(
  input: NewBurn,
  client?: ServerSupabaseClient | null
): Promise<Burn> {
  const tokens = Math.max(0, Math.round(input.tokens));
  const model = normalizeModelName(input.model);

  if (isSupabaseConfigured()) {
    if (!input.userId) throw new Error("Sign in before posting a burn.");

    const supabase = client ?? (await createServerSupabaseClient());
    if (!supabase) throw new Error("Supabase is not configured.");

    const profile = await getUserById(input.userId, supabase);
    if (!profile?.id) throw new Error("Finish your profile before posting.");

    const { data: recordedModel, error: modelError } = await supabase.rpc("record_ai_model", {
      model_name: model,
    });
    if (modelError) throw modelError;

    const { data, error } = await supabase
      .from("burns")
      .insert({
        user_id: input.userId,
        tokens,
        cost: input.cost != null ? Math.max(0, input.cost) : (tokens / 1_000_000) * 6,
        model: recordedModel || model,
        image_url: input.imageUrl,
        caption: input.caption?.trim().slice(0, 180) || null,
      })
      .select("*")
      .single();

    if (error) throw error;

    return rowToBurn(data, {
      id: profile.id,
      handle: profile.handle,
      display_name: profile.displayName,
      company: profile.company ?? null,
      avatar_url: profile.avatarUrl ?? null,
      bio: profile.bio ?? null,
      website: profile.website ?? null,
      default_model: profile.defaultModel ?? null,
      join_code: profile.joinCode ?? "",
      invited_by: profile.invitedBy ?? null,
      created_at: profile.createdAt,
      updated_at: profile.createdAt,
    });
  }

  const handle = normalizeHandle(input.handle || "");
  if (!handle) throw new Error("Supabase is not configured, and no local handle was provided.");

  const burn: Burn = {
    id: nanoid(14),
    handle,
    displayName: (input.displayName || input.handle || "Anonymous").trim().slice(0, 80),
    avatar: input.avatar?.trim() || "",
    tokens,
    cost: input.cost != null ? Math.max(0, input.cost) : (tokens / 1_000_000) * 6,
    model,
    imageUrl: input.imageUrl,
    caption: input.caption?.trim().slice(0, 180) || undefined,
    createdAt: new Date().toISOString(),
  };

  const all = await readJson();
  all.push(burn);
  await writeJson(all);
  await upsertUser(burn.handle, burn.displayName).catch(() => {});
  return burn;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Consecutive calendar days (UTC) with at least one burn, counting back from
 * today (or yesterday if you haven't posted yet today). */
export function computeStreak(dates: string[]): number {
  const days = new Set(dates.map((iso) => dayKey(new Date(iso))));
  const cur = new Date();
  if (!days.has(dayKey(cur))) {
    cur.setUTCDate(cur.getUTCDate() - 1);
    if (!days.has(dayKey(cur))) return 0;
  }
  let streak = 0;
  while (days.has(dayKey(cur))) {
    streak++;
    cur.setUTCDate(cur.getUTCDate() - 1);
  }
  return streak;
}

function datesByHandle(burns: Burn[]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const b of burns) {
    const arr = m.get(b.handle) ?? [];
    arr.push(b.createdAt);
    m.set(b.handle, arr);
  }
  return m;
}

function bestDay(burns: Burn[]): { tokens: number; date?: string } {
  const byDay = new Map<string, number>();

  for (const burn of burns) {
    const day = dayKey(new Date(burn.createdAt));
    byDay.set(day, (byDay.get(day) ?? 0) + burn.tokens);
  }

  let bestTokens = 0;
  let bestDate: string | undefined;
  for (const [date, total] of byDay) {
    if (total > bestTokens || (total === bestTokens && bestDate && date > bestDate)) {
      bestTokens = total;
      bestDate = date;
    }
  }

  return { tokens: bestTokens, date: bestDate };
}

export async function me(handle: string): Promise<Me> {
  const h = normalizeHandle(handle);
  const p = await profile(h);
  return {
    handle: p.handle,
    displayName: p.displayName,
    avatarUrl: p.avatarUrl,
    streak: p.streak,
    postedToday: p.postedToday,
    posts: p.posts,
    totalTokens: p.totalTokens,
    bestDayTokens: p.bestDayTokens,
    bestDayDate: p.bestDayDate,
  };
}

export async function leaderboard(range: Range, limit = 100): Promise<RankEntry[]> {
  const burns = await listBurns(1000);
  const streaks = datesByHandle(burns);
  const cutoff = range === "all" ? Number.NEGATIVE_INFINITY : Date.now() - rangeWindowMs(range);
  const inWindow = burns.filter((b) => +new Date(b.createdAt) >= cutoff);

  const byHandle = new Map<string, RankEntry & { _t: number }>();
  for (const b of inWindow) {
    const cur = byHandle.get(b.handle);
    if (!cur) {
      byHandle.set(b.handle, {
        rank: 0,
        handle: b.handle,
        displayName: b.displayName,
        avatar: b.avatarUrl || b.avatar,
        totalTokens: b.tokens,
        posts: 1,
        topBurn: b.tokens,
        imageUrl: b.imageUrl,
        model: b.model,
        streak: 0,
        lastBurnAt: b.createdAt,
        _t: +new Date(b.createdAt),
      });
    } else {
      cur.totalTokens += b.tokens;
      cur.posts += 1;
      if (b.tokens > cur.topBurn) {
        cur.topBurn = b.tokens;
        cur.imageUrl = b.imageUrl;
        cur.model = b.model;
      }
      if (+new Date(b.createdAt) > cur._t) {
        cur._t = +new Date(b.createdAt);
        cur.lastBurnAt = b.createdAt;
      }
    }
  }

  return [...byHandle.values()]
    .sort((a, b) => b.totalTokens - a.totalTokens)
    .slice(0, limit)
    .map((e, i) => ({
      rank: i + 1,
      handle: e.handle,
      displayName: e.displayName,
      avatar: e.avatar,
      totalTokens: e.totalTokens,
      posts: e.posts,
      topBurn: e.topBurn,
      imageUrl: e.imageUrl,
      model: e.model,
      lastBurnAt: e.lastBurnAt,
      streak: computeStreak(streaks.get(e.handle) ?? []),
    }));
}

export async function totals(): Promise<{ burned: number; posts: number; burners: number }> {
  const burns = await listBurns(1000);
  const burners = new Set(burns.map((b) => b.handle)).size;
  const burned = burns.reduce((s, b) => s + b.tokens, 0);
  return { burned, posts: burns.length, burners };
}

/** The home feed: burns from people you follow, plus your own. */
export async function friendsFeed(
  handle: string,
  limit = 100
): Promise<{ burns: Burn[]; discover: boolean }> {
  const burns = await listBurns(1000);
  const h = normalizeHandle(handle);
  if (!h) return { burns: burns.slice(0, limit), discover: true };

  const following = new Set([...(await getFollowing(h)), h]);
  const friends = burns.filter((b) => following.has(b.handle));
  if (friends.length === 0) {
    return { burns: burns.slice(0, limit), discover: true };
  }
  return { burns: friends.slice(0, limit), discover: false };
}

/** People worth following, ranked by tokens burned, excluding you + who you follow. */
export async function discover(handle: string, limit = 20): Promise<Suggestion[]> {
  const burns = await listBurns(1000);
  const h = normalizeHandle(handle);
  const exclude = new Set([h, ...(h ? await getFollowing(h) : [])].filter(Boolean));

  const agg = new Map<string, Suggestion>();
  for (const b of burns) {
    if (exclude.has(b.handle)) continue;
    const cur = agg.get(b.handle);
    if (!cur) {
      agg.set(b.handle, {
        handle: b.handle,
        displayName: b.displayName,
        totalTokens: b.tokens,
        posts: 1,
        avatarUrl: b.avatarUrl ?? null,
      });
    } else {
      cur.totalTokens += b.tokens;
      cur.posts += 1;
    }
  }

  const users = await listUsers();
  for (const u of users) {
    if (exclude.has(u.handle) || agg.has(u.handle)) continue;
    agg.set(u.handle, {
      handle: u.handle,
      displayName: u.displayName,
      totalTokens: 0,
      posts: 0,
      avatarUrl: u.avatarUrl ?? null,
    });
  }

  return [...agg.values()].sort((a, b) => b.totalTokens - a.totalTokens).slice(0, limit);
}

export async function profile(handle: string): Promise<Profile> {
  const h = normalizeHandle(handle);
  const burns = await listBurns(1000);
  const mine = burns.filter((b) => b.handle === h);
  const user = await getUser(h);
  const dates = mine.map((b) => b.createdAt);
  const today = dayKey(new Date());
  const counts = await followCounts(h);
  const best = bestDay(mine);

  const board = await leaderboard("all", 10_000);
  const rank = board.find((e) => e.handle === h)?.rank ?? null;

  return {
    id: user?.id,
    handle: h,
    displayName: user?.displayName || mine[0]?.displayName || h,
    company: user?.company,
    avatarUrl: user?.avatarUrl,
    bio: user?.bio,
    website: user?.website,
    defaultModel: user?.defaultModel,
    joinCode: user?.joinCode,
    streak: computeStreak(dates),
    postedToday: dates.some((d) => dayKey(new Date(d)) === today),
    posts: mine.length,
    totalTokens: mine.reduce((s, b) => s + b.tokens, 0),
    bestBurn: mine.reduce((m, b) => Math.max(m, b.tokens), 0),
    bestDayTokens: best.tokens,
    bestDayDate: best.date,
    followers: counts.followers,
    following: counts.following,
    rank,
    burns: mine,
  };
}

export async function listModels(): Promise<string[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return mergeModels([]);

    const { data, error } = await supabase
      .from("ai_models")
      .select("name")
      .order("is_base", { ascending: false })
      .order("uses_count", { ascending: false })
      .order("name", { ascending: true });

    if (error) throw error;
    return mergeModels((data ?? []).map((row) => row.name));
  }

  const burns = await readJson();
  return mergeModels(burns.map((b) => b.model || "").filter(Boolean));
}
