import { LinksClient } from "@/components/links/LinksClient";
import { env } from "@/lib/env";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function LinksPage() {
  const { bookName } = await getSettings();
  return <LinksClient links={env.socialLinks()} bookName={bookName} />;
}
