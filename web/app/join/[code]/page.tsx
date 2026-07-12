import { FriendClaim } from "@/components/FriendClaim";

export const metadata = {
  title: "Join Burnt",
};

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <FriendClaim code={code} />;
}
