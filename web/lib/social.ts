import { promises as fs } from "fs";
import path from "path";
import { createServerSupabaseClient, isSupabaseConfigured } from "./supabase/server";
import type { ServerSupabaseClient } from "./supabase/server";
import type { Database } from "./supabase/types";
import type { User } from "./types";

const DATA_DIR = process.env.VERCEL ? "/tmp/burnt-data" : path.join(process.cwd(), ".data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const FOLLOWS_FILE = path.join(DATA_DIR, "follows.json");

type Follow = { follower: string; following: string; createdAt: string };
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

async function readColl<T>(file: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw) as T[];
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* not created yet */
  }

  return [];
}

async function writeColl<T>(file: string, data: T[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

export function normalizeHandle(handle: string): string {
  return handle.trim().replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24);
}

function normalizeWebsite(value: string | null | undefined): string | null {
  const raw = value?.trim().slice(0, 200) ?? "";
  if (!raw) return null;

  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function rowToUser(row: ProfileRow): User {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.display_name,
    company: row.company ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    bio: row.bio ?? undefined,
    website: row.website ?? undefined,
    defaultModel: row.default_model ?? undefined,
    joinCode: row.join_code,
    invitedBy: row.invited_by,
    createdAt: row.created_at,
  };
}

/* ---------------------------------- users --------------------------------- */

export async function listUsers(): Promise<User[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;
    return (data ?? []).map(rowToUser);
  }

  return readColl<User>(USERS_FILE);
}

export async function upsertUser(handle: string, displayName: string): Promise<User> {
  if (isSupabaseConfigured()) {
    throw new Error("Profiles are created through Supabase Auth.");
  }

  const h = normalizeHandle(handle);
  const users = await listUsers();
  const existing = users.find((u) => u.handle === h);
  if (existing) {
    if (displayName && displayName !== existing.displayName) {
      existing.displayName = displayName.slice(0, 80);
      await writeColl(USERS_FILE, users);
    }
    return existing;
  }

  const user: User = {
    handle: h,
    displayName: (displayName || h).slice(0, 80),
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await writeColl(USERS_FILE, users);
  return user;
}

export async function getUser(
  handle: string,
  client?: ServerSupabaseClient | null
): Promise<User | undefined> {
  const h = normalizeHandle(handle);

  if (isSupabaseConfigured()) {
    const supabase = client ?? (await createServerSupabaseClient());
    if (!supabase || !h) return undefined;

    const { data, error } = await supabase.from("profiles").select("*").eq("handle", h).maybeSingle();
    if (error) throw error;
    return data ? rowToUser(data) : undefined;
  }

  return (await listUsers()).find((u) => u.handle === h);
}

export async function getUserById(
  id: string,
  client?: ServerSupabaseClient | null
): Promise<User | undefined> {
  if (!isSupabaseConfigured()) return undefined;

  const supabase = client ?? (await createServerSupabaseClient());
  if (!supabase) return undefined;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? rowToUser(data) : undefined;
}

export async function searchUsers(query: string, limit = 20): Promise<User[]> {
  const q = normalizeHandle(query);

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return [];

    let request = supabase.from("profiles").select("*").limit(limit);
    if (q) request = request.or(`handle.ilike.%${q}%,display_name.ilike.%${q}%`);

    const { data, error } = await request.order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToUser);
  }

  const users = await listUsers();
  if (!q) return users.slice(0, limit);
  return users
    .filter((u) => u.handle.includes(q) || u.displayName.toLowerCase().includes(q))
    .slice(0, limit);
}

export async function updateProfileForUser(
  userId: string,
  input: {
    handle: string;
    displayName: string;
    company?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    website?: string | null;
    defaultModel?: string | null;
  },
  client?: ServerSupabaseClient | null
): Promise<User> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = client ?? (await createServerSupabaseClient());
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("profiles")
    .update({
      handle: normalizeHandle(input.handle),
      display_name: input.displayName.trim().slice(0, 80),
      company: input.company?.trim().slice(0, 120) || null,
      avatar_url: input.avatarUrl?.trim() || null,
      bio: input.bio?.trim().slice(0, 220) || null,
      website: normalizeWebsite(input.website),
      default_model: input.defaultModel?.trim().slice(0, 120) || null,
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return rowToUser(data);
}

/* --------------------------------- follows -------------------------------- */

export async function listFollows(): Promise<Follow[]> {
  if (isSupabaseConfigured()) return [];
  return readColl<Follow>(FOLLOWS_FILE);
}

export async function getFollowing(handle: string): Promise<string[]> {
  const h = normalizeHandle(handle);

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const user = await getUser(h);
    if (!supabase || !user?.id) return [];

    const { data, error } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
    if (error) throw error;

    const ids = (data ?? []).map((f) => f.following_id);
    if (ids.length === 0) return [];

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("handle")
      .in("id", ids);
    if (profilesError) throw profilesError;

    return (profiles ?? []).map((p) => p.handle);
  }

  return (await listFollows()).filter((f) => f.follower === h).map((f) => f.following);
}

export async function getFollowers(handle: string): Promise<string[]> {
  const h = normalizeHandle(handle);

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const user = await getUser(h);
    if (!supabase || !user?.id) return [];

    const { data, error } = await supabase.from("follows").select("follower_id").eq("following_id", user.id);
    if (error) throw error;

    const ids = (data ?? []).map((f) => f.follower_id);
    if (ids.length === 0) return [];

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("handle")
      .in("id", ids);
    if (profilesError) throw profilesError;

    return (profiles ?? []).map((p) => p.handle);
  }

  return (await listFollows()).filter((f) => f.following === h).map((f) => f.follower);
}

export async function isFollowing(follower: string, following: string): Promise<boolean> {
  const a = normalizeHandle(follower);
  const b = normalizeHandle(following);

  if (isSupabaseConfigured()) {
    const followerUser = await getUser(a);
    if (!followerUser?.id) return false;
    return isFollowingUserId(followerUser.id, b);
  }

  return (await listFollows()).some((f) => f.follower === a && f.following === b);
}

export async function isFollowingUserId(
  followerId: string | null | undefined,
  following: string,
  client?: ServerSupabaseClient | null
): Promise<boolean> {
  if (!followerId) return false;
  const target = await getUser(following, client);
  if (!target?.id) return false;

  const supabase = client ?? (await createServerSupabaseClient());
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", target.id)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function setFollow(follower: string, following: string, on: boolean): Promise<void> {
  const a = normalizeHandle(follower);
  const b = normalizeHandle(following);
  if (!a || !b || a === b) return;

  if (isSupabaseConfigured()) {
    const followerUser = await getUser(a);
    if (!followerUser?.id) throw new Error("Follower not found.");
    await setFollowByUserId(followerUser.id, b, on);
    return;
  }

  const follows = await listFollows();
  const idx = follows.findIndex((f) => f.follower === a && f.following === b);
  if (on && idx === -1) {
    follows.push({ follower: a, following: b, createdAt: new Date().toISOString() });
    await writeColl(FOLLOWS_FILE, follows);
  } else if (!on && idx !== -1) {
    follows.splice(idx, 1);
    await writeColl(FOLLOWS_FILE, follows);
  }
}

export async function setFollowByUserId(
  followerId: string,
  following: string,
  on: boolean,
  client?: ServerSupabaseClient | null
): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");

  const target = await getUser(following, client);
  if (!target?.id) throw new Error("User not found.");
  if (target.id === followerId) return;

  const supabase = client ?? (await createServerSupabaseClient());
  if (!supabase) throw new Error("Supabase is not configured.");

  if (on) {
    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: followerId, following_id: target.id });
    if (error && error.code !== "23505") throw error;
  } else {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", target.id);
    if (error) throw error;
  }
}

export async function followCounts(handle: string): Promise<{ followers: number; following: number }> {
  const h = normalizeHandle(handle);

  if (isSupabaseConfigured()) {
    const user = await getUser(h);
    const supabase = await createServerSupabaseClient();
    if (!supabase || !user?.id) return { followers: 0, following: 0 };

    const [{ count: followers, error: followersError }, { count: following, error: followingError }] =
      await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
      ]);

    if (followersError) throw followersError;
    if (followingError) throw followingError;
    return { followers: followers ?? 0, following: following ?? 0 };
  }

  const follows = await listFollows();
  return {
    followers: follows.filter((f) => f.following === h).length,
    following: follows.filter((f) => f.follower === h).length,
  };
}
