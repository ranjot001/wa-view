import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/settings";

// Served at /manifest.webmanifest. The installed app is named after the admin's book name.
export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { bookName } = await getSettings();
  return {
    id: "/",
    name: bookName,
    short_name: bookName.length > 12 ? bookName.split(" ")[0] : bookName,
    description: `Chat with ${bookName} support.`,
    start_url: "/chat",
    scope: "/",
    display: "standalone",
    background_color: "#0a1324",
    theme_color: "#0a1324",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
