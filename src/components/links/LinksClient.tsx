"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import {
  ChatBubbleIcon,
  ChevronRightIcon,
  DownloadIcon,
  GlobeIcon,
  InstagramIcon,
  TelegramIcon,
  WhatsAppIcon,
} from "@/components/ui/Icons";
import { usePwaInstall } from "@/lib/pwa";

export interface SocialLinks {
  whatsapp: string;
  telegram: string;
  instagram: string;
  website: string;
}

const ITEMS: {
  key: keyof SocialLinks;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tile: string; // icon tile gradient
  accent: string; // left border colour
}[] = [
  {
    key: "whatsapp",
    title: "WhatsApp",
    subtitle: "Chat with us on WhatsApp",
    icon: <WhatsAppIcon className="h-7 w-7" />,
    tile: "from-[#2fe57a] to-[#12a150]",
    accent: "#25d366",
  },
  {
    key: "telegram",
    title: "Telegram",
    subtitle: "Join our Telegram channel",
    icon: <TelegramIcon className="h-6 w-6" />,
    tile: "from-[#37aee2] to-[#1b78c2]",
    accent: "#2aa3e0",
  },
  {
    key: "instagram",
    title: "Instagram",
    subtitle: "Follow us on Instagram",
    icon: <InstagramIcon className="h-6 w-6" />,
    tile: "from-[#f9a03f] via-[#e1306c] to-[#c13584]",
    accent: "#e1306c",
  },
  {
    key: "website",
    title: "Website",
    subtitle: "Visit our official website",
    icon: <GlobeIcon className="h-6 w-6" />,
    tile: "from-[#4f8df5] to-[#34b27b]",
    accent: "#3b82f6",
  },
];

export function LinksClient({ links, bookName }: { links: SocialLinks; bookName: string }) {
  const pwa = usePwaInstall();
  const items = ITEMS.filter((i) => links[i.key]);

  return (
    <main className="links-bg relative min-h-dvh px-4 pb-32 pt-12">
      <div className="mx-auto w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[var(--ink-950)] shadow-[0_0_48px_rgba(235,197,106,0.28)] ring-2 ring-[var(--gold-500)]/40">
            <Logo size={92} />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-white">{bookName}</h1>
          <p className="mt-1 text-sm text-neutral-400">Follow us &amp; stay connected</p>
        </div>

        <ul className="mt-8 space-y-3.5">
          {items.map((i) => (
            <li key={i.key}>
              <a
                href={links[i.key]}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 backdrop-blur transition hover:bg-white/[0.08] active:scale-[0.99]"
                style={{ borderLeft: `3px solid ${i.accent}` }}
              >
                <span
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${i.tile}`}
                >
                  {i.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-semibold text-white">{i.title}</span>
                  <span className="block truncate text-sm text-neutral-400">{i.subtitle}</span>
                </span>
                <ChevronRightIcon className="h-5 w-5 text-neutral-500 transition group-hover:translate-x-0.5" />
              </a>
            </li>
          ))}
          {items.length === 0 && (
            <li className="rounded-2xl border border-white/10 px-4 py-6 text-center text-sm text-neutral-500">
              Social links coming soon.
            </li>
          )}
        </ul>

        {pwa.ready && !pwa.installed && (
          <Link
            href="/install"
            className="mt-6 flex items-center justify-center gap-3 rounded-2xl btn-gold px-4 py-3.5"
          >
            <DownloadIcon className="h-6 w-6" />
            <span className="leading-tight">
              <span className="block text-xl font-bold">Install App</span>
              <span className="block text-xs font-semibold uppercase tracking-wider text-[#1d1406]/70">
                Get the mobile app
              </span>
            </span>
          </Link>
        )}
      </div>

      {/* Floating "back to chat" */}
      <Link
        href="/chat"
        className="fixed bottom-6 right-4 flex items-center gap-3"
        aria-label="Chat with us"
      >
        <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm text-neutral-700 shadow-lg">
          <ChatBubbleIcon className="h-4 w-4 text-neutral-400" />
          Need help? <b className="text-[var(--wa-header)]">Chat with us!</b>
        </span>
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--wa-header)] text-white shadow-xl ring-4 ring-white/10">
          <ChatBubbleIcon className="h-7 w-7" />
        </span>
      </Link>
    </main>
  );
}
