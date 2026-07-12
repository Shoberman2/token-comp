import { ProfileView } from "@/components/ProfileView";
import { profile } from "@/lib/store";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  try {
    const data = await profile(handle);
    const title = `${data.displayName} (@${data.handle}) — Burnt`;
    const description = data.bio || `${data.displayName} has burned ${data.totalTokens.toLocaleString()} AI tokens.`;
    return { title, description, openGraph: { title, description, type: "profile" } };
  } catch {
    return { title: `@${handle} — Burnt` };
  }
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  return <ProfileView handle={handle} />;
}
