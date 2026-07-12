import { nanoid } from "nanoid";
import type { ServerSupabaseClient } from "./supabase/server";

function extFromType(type: string): string {
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("heic") || type.includes("heif")) return "heic";
  if (type.includes("gif")) return "gif";
  return "jpg";
}

export async function saveImage(
  file: File,
  userId: string,
  supabase: ServerSupabaseClient
): Promise<string> {
  const ext = extFromType(file.type || "image/jpeg");
  const path = `${userId}/${nanoid(14)}.${ext}`;
  const { data, error } = await supabase.storage.from("burns").upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw error;

  const { data: publicData } = supabase.storage.from("burns").getPublicUrl(data.path);
  return publicData.publicUrl;
}
