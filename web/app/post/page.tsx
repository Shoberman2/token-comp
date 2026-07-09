import { PostForm } from "@/components/PostForm";

export const metadata = {
  title: "Post your burn — Burnt",
};

export default function PostPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="rise pt-2 text-center">
        <h1 className="font-display text-2xl font-bold">
          Post token usage
        </h1>
        <p className="text-sm text-fog">Upload a usage screenshot and select the AI model.</p>
      </div>
      <PostForm />
    </div>
  );
}
