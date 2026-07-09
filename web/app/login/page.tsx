import { AuthForm } from "@/components/AuthForm";

export const metadata = {
  title: "Sign in — Burnt",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const join = typeof params.join === "string" ? params.join : undefined;
  const next = typeof params.next === "string" ? params.next : "/profile";

  return <AuthForm joinCode={join} next={next} />;
}
