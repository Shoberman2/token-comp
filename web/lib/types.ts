export type Burn = {
  id: string;
  userId?: string;
  handle: string;
  displayName: string;
  avatar: string;
  avatarUrl?: string;
  company?: string;
  tokens: number;
  cost?: number;
  model?: string;
  imageUrl: string;
  caption?: string;
  createdAt: string; // ISO
};

export type Range = "day" | "week" | "month" | "all";

export type RankEntry = {
  rank: number;
  handle: string;
  displayName: string;
  avatar: string;
  totalTokens: number;
  posts: number;
  topBurn: number;
  imageUrl: string;
  model?: string;
  streak: number;
  lastBurnAt: string;
};

export type Me = {
  handle: string;
  displayName?: string;
  avatarUrl?: string;
  streak: number;
  postedToday: boolean;
  posts: number;
  totalTokens: number;
  bestDayTokens: number;
  bestDayDate?: string;
};

export type User = {
  id?: string;
  handle: string;
  displayName: string;
  company?: string;
  avatarUrl?: string;
  bio?: string;
  website?: string;
  defaultModel?: string;
  joinCode?: string;
  invitedBy?: string | null;
  createdAt: string;
};

export type Profile = {
  id?: string;
  handle: string;
  displayName: string;
  company?: string;
  avatarUrl?: string;
  bio?: string;
  website?: string;
  defaultModel?: string;
  joinCode?: string;
  streak: number;
  postedToday: boolean;
  posts: number;
  totalTokens: number;
  bestBurn: number;
  bestDayTokens: number;
  bestDayDate?: string;
  followers: number;
  following: number;
  rank: number | null; // all-time rank, if any
  burns: Burn[];
};

export type FeedItem = Burn;

export type Suggestion = {
  handle: string;
  displayName: string;
  totalTokens: number;
  posts: number;
  avatarUrl: string | null;
};

export const RANGES: { key: Range; label: string; short: string }[] = [
  { key: "day", label: "Today", short: "24h" },
  { key: "week", label: "This Week", short: "7d" },
  { key: "month", label: "This Month", short: "30d" },
  { key: "all", label: "All-Time", short: "∞" },
];

export function rangeWindowMs(range: Range): number {
  switch (range) {
    case "day":
      return 24 * 60 * 60 * 1000;
    case "week":
      return 7 * 24 * 60 * 60 * 1000;
    case "month":
      return 30 * 24 * 60 * 60 * 1000;
    case "all":
      return Number.POSITIVE_INFINITY;
  }
}
