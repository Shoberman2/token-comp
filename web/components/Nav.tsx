"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, Trophy, User } from "lucide-react";
import { Logo } from "./Logo";
import { StreakChip } from "./StreakChip";
import { ThemeToggle } from "./ThemeToggle";
import type { Profile } from "@/lib/types";

const links = [
  { href: "/feed", label: "Feed", icon: <Home size={20} /> },
  { href: "/leaderboard", label: "Ranks", icon: <Trophy size={20} /> },
  { href: "/post", label: "Post", icon: <Plus size={20} /> },
  { href: "/profile", label: "Profile", icon: <User size={20} /> },
];

export function Nav() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (alive && data?.profile) setProfile(data.profile as Profile);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-ink/95 backdrop-blur">
        <div className="relative mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-5">
          <Link href="/" aria-label="Burnt home">
            <Logo size={22} />
          </Link>

          <nav
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex"
            aria-label="Primary navigation"
          >
            {links.map((link) => (
              <DesktopLink key={link.href} href={link.href} active={isActive(pathname, link.href)}>
                {link.label}
              </DesktopLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2.5 md:flex">
            <ThemeToggle />
            <StreakChip />
            {profile ? (
              <Link
                href="/profile"
                className="rounded-(--radius-control) border border-line px-3.5 py-1.5 text-sm font-semibold text-fog transition hover:border-smoke hover:text-bone"
              >
                Account
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-(--radius-control) bg-bone px-3.5 py-1.5 text-sm font-bold text-ink transition hover:opacity-90"
              >
                Sign in
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <StreakChip />
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden" aria-label="Mobile navigation">
        <div className="mx-auto max-w-2xl px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2">
          <div className="glass-blur grid grid-cols-4 rounded-card p-1 shadow-[0_10px_32px_-18px_rgba(0,0,0,0.9)]">
            {links.map((link) => (
              <TabLink
                key={link.href}
                href={link.href}
                active={isActive(pathname, link.href)}
                icon={link.icon}
                label={link.label}
              />
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/profile") return pathname === "/profile" || pathname.startsWith("/u/");
  return pathname === href;
}

function DesktopLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-(--radius-control) px-3 py-1.5 text-sm font-semibold transition ${
        active ? "bg-panel-2 text-bone" : "text-fog hover:text-bone"
      }`}
    >
      {children}
    </Link>
  );
}

function TabLink({
  href,
  active,
  icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-[12px] text-[10px] font-semibold transition-colors ${
        active ? "bg-bone text-ink" : "text-dim hover:text-fog"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
