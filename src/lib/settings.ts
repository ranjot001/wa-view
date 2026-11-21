import { cache } from "react";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AppSettings {
  bookName: string;
  supportName: string;
  welcomeMessage: string; // may contain {book}
}

export const DEFAULT_WELCOME = `✈️ {book}✈️

📲 Download our App & click INSTALL APPLICATION.
🔔 Allow Notifications to receive every latest update!

🇮🇳 हिंदी: 📲 {book} ऐप डाउनलोड करें और INSTALL APPLICATION पर क्लिक करें। 🔔 सभी अपडेट के लिए नोटिफिकेशन चालू करें!

🇮🇳 తెలుగు: 📲 {book} యాప్ డౌన్‌లోడ్ చేసి INSTALL APPLICATION క్లిక్ చేయండి. 🔔 అన్ని అప్‌డేట్స్ కోసం నోటిఫికేషన్లను అనుమతించండి!`;

export const DEFAULT_SETTINGS: AppSettings = {
  bookName: "SPRINTER BOOK",
  supportName: "SPRINTER PANEL HUB",
  welcomeMessage: DEFAULT_WELCOME,
};

export const settingsSchema = z.object({
  bookName: z.string().trim().min(1, "Book name is required").max(40),
  supportName: z.string().trim().min(1, "Support name is required").max(40),
  welcomeMessage: z.string().trim().min(1, "Welcome message is required").max(2000),
});

// Server-only. Falls back to defaults if the table isn't there yet (migration 0004).
export const getSettings = cache(async (): Promise<AppSettings> => {
  const { data, error } = await createAdminClient()
    .from("app_settings")
    .select("book_name, support_name, welcome_message")
    .eq("id", 1)
    .maybeSingle<{ book_name: string; support_name: string; welcome_message: string }>();
  if (error || !data) return DEFAULT_SETTINGS;
  return {
    bookName: data.book_name || DEFAULT_SETTINGS.bookName,
    supportName: data.support_name || DEFAULT_SETTINGS.supportName,
    welcomeMessage: data.welcome_message || DEFAULT_WELCOME,
  };
});

export function renderWelcome(s: AppSettings): string {
  return s.welcomeMessage.replaceAll("{book}", s.bookName);
}
