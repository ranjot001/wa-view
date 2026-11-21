import { AdminCallCenter } from "@/components/admin/AdminCallCenter";

// Persists across the inbox and thread pages so incoming calls ring anywhere.
export default function AdminConversationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AdminCallCenter />
    </>
  );
}
