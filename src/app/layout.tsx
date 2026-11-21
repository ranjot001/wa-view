import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorker } from "@/components/ui/ServiceWorker";
import { getSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const { bookName } = await getSettings();
  return {
    title: bookName,
    description: `Chat with ${bookName} support.`,
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, title: bookName, statusBarStyle: "default" },
    icons: { icon: "/icons/icon.svg", apple: "/icons/icon-192.png" },
  };
}

export const viewport: Viewport = {
  themeColor: "#0a1324",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
