import { AuthForm } from "@/components/AuthForm";

export const metadata = {
  title: "Join Burnt",
};

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <AuthForm joinCode={code} next="/profile" />;
}
