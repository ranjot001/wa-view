import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorker } from "@/components/ui/ServiceWorker";

export const metadata: Metadata = {
  title: "Sprinter Customer Care",
  description: "Verify your mobile and chat with Sprinter Customer Care support.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Sprinter Care", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#075e54",
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
