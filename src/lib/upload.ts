import type { SupabaseClient } from "@supabase/supabase-js";
import type { MediaType } from "@/lib/types";

export function detectMediaType(mime: string): MediaType {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  return "file";
}

function extFor(file: Blob, fallback: string): string {
  const fromName = (file as File).name?.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{1,5}$/.test(fromName)) return fromName;
  const map: Record<string, string> = {
    "audio/webm": "webm",
    "image/png": "png",
    "image/jpeg": "jpg",
  };
  return map[file.type] || fallback;
}

// Uploads to the public chat-media bucket and returns { url, mediaType }.
export async function uploadChatMedia(
  supabase: SupabaseClient,
  conversationId: string,
  file: Blob
): Promise<{ url: string; mediaType: MediaType }> {
  // "audio/webm;codecs=opus" -> "audio/webm" so it matches the bucket's MIME allow-list.
  const contentType = file.type.split(";")[0].trim() || "application/octet-stream";
  const mediaType = detectMediaType(contentType);
  const ext = extFor(file, mediaType === "audio" ? "webm" : "bin");
  const path = `${conversationId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("chat-media")
    .upload(path, file, { contentType });
  if (error) throw error;

  const { data } = supabase.storage.from("chat-media").getPublicUrl(path);
  return { url: data.publicUrl, mediaType };
}
