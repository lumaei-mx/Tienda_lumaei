import { readStoreSettings } from "@/lib/settings-db";
import { EnviosContent } from "@/components/EnviosContent";

export default async function EnviosPage() {
  const s = await readStoreSettings();
  return (
    <EnviosContent freeMx={s.freeShippingMxUsd} freeUs={s.freeShippingUsd} />
  );
}
