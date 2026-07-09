import { ProfileView } from "@/components/ProfileView";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  return <ProfileView handle={handle} />;
}
