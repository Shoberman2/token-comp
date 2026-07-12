import { PostForm } from "@/components/PostForm";
import { PageHeader } from "@/components/PageHeader";

export const metadata = {
  title: "Post your burn — Burnt",
};

export default function PostPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Post token usage" sub="Upload a usage screenshot and select the AI model" />
      <PostForm />
    </div>
  );
}
