import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";

function extFromType(type: string): string {
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("heic") || type.includes("heif")) return "heic";
  if (type.includes("gif")) return "gif";
  return "jpg";
}

/**
 * Persists an uploaded screenshot and returns a public URL.
 * - Production (Vercel Blob configured) -> uploads to Blob.
 * - Local dev -> writes to /public/uploads.
 * - Fallback -> inlined data URI (keeps the app working with zero config).
 */
export async function saveImage(file: File): Promise<string> {
  const ext = extFromType(file.type || "image/jpeg");

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`burns/${nanoid(14)}.${ext}`, file, {
      access: "public",
      contentType: file.type || "image/jpeg",
    });
    return blob.url;
  }

  const buf = Buffer.from(await file.arrayBuffer());
  try {
    const dir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(dir, { recursive: true });
    const name = `${nanoid(14)}.${ext}`;
    await fs.writeFile(path.join(dir, name), buf);
    return `/uploads/${name}`;
  } catch {
    return `data:${file.type || "image/jpeg"};base64,${buf.toString("base64")}`;
  }
}
