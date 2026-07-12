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
  const errorCode = typeof params.error === "string" ? params.error : undefined;
  const initialError = errorCode
    ? errorCode === "auth-confirmation-failed"
      ? "That confirmation link is invalid or has expired."
      : "Authentication could not be completed. Please try again."
    : undefined;

  return <AuthForm joinCode={join} next={next} initialError={initialError} />;
}
