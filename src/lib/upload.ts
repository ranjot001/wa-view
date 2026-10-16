import type { SupabaseClient } from "@supabase/supabase-js";
import type { MediaType } from "@/lib/types";

export function detectMediaType(mime: string): MediaType {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  return "file";
}

function extFor(file: Blob, fallback: string): string {
  const fromName = (file as File).name?.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName;
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
  const mediaType = detectMediaType(file.type);
  const ext = extFor(file, mediaType === "audio" ? "webm" : "bin");
  const path = `${conversationId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("chat-media")
    .upload(path, file, { contentType: file.type || "application/octet-stream" });
  if (error) throw error;

  const { data } = supabase.storage.from("chat-media").getPublicUrl(path);
  return { url: data.publicUrl, mediaType };
}
