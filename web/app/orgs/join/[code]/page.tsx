import { OrgJoinClaim } from "@/components/OrgJoinClaim";

export const metadata = {
  title: "Join an organization — Burnt",
};

export default async function OrgJoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <OrgJoinClaim code={code} />;
}
