// Shared domain types mirroring the Postgres schema (see supabase/migrations).

export type ConversationStatus = "bot" | "pending_human" | "human" | "closed";
export type SenderType = "user" | "bot" | "admin";
export type MediaType = "image" | "audio" | "file";

export interface Profile {
  id: string;
  phone: string | null;
  display_name: string | null;
  is_admin: boolean;
  created_at: string;
  last_seen_at: string | null;
}

export interface Conversation {
  id: string;
  user_id: string;
  status: ConversationStatus;
  assigned_admin: string | null;
  last_message_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: SenderType;
  sender_id: string | null;
  body: string | null;
  media_url: string | null;
  media_type: MediaType | null;
  reply_to: string | null;
  created_at: string;
  read_at: string | null;
}

// Conversation joined with the user's profile, used by the admin dashboard.
export interface ConversationWithProfile extends Conversation {
  profile: Pick<Profile, "id" | "phone" | "display_name"> | null;
  unread?: number;
  last_message?: string | null;
}
