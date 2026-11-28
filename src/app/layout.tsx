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
    icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
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
      <head>
        {/* Catch the install prompt before React hydrates — Chrome often fires it very early,
            and if we miss it the Install button can't open the one-tap native dialog. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__bip=e;});",
          }}
        />
      </head>
      <body className="antialiased">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
