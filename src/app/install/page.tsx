import { InstallClient } from "@/components/install/InstallClient";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function InstallPage() {
  const { bookName } = await getSettings();
  return <InstallClient bookName={bookName} />;
}
