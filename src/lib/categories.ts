// Agrupación limpia de categorías CJ → grupos de tienda (ES/EN).
import { t, type Lang } from "./i18n";

export type CatalogGroup = "Pet" | "Kitchen" | "Home" | "Electronics" | "Auto" | "Lifestyle";

export function groupCategory(category: string): CatalogGroup {
  const c = category.toLowerCase();
  if (
    c.includes("pet") ||
    c.includes("dog") ||
    c.includes("cat") ||
    c.includes("groom") ||
    c.includes("feeding") ||
    c.includes("shower")
  )
    return "Pet";
  if (
    c.includes("kitchen") ||
    c.includes("cookware") ||
    c.includes("dining") ||
    c.includes("drinkware") ||
    c.includes("coffee") ||
    c.includes("bar")
  )
    return "Kitchen";
  if (
    c.includes("home") ||
    c.includes("decor") ||
    c.includes("furniture") ||
    c.includes("storage") ||
    c.includes("lighting") ||
    c.includes("tools")
  )
    return "Home";
  if (
    c.includes("electronics") ||
    c.includes("charger") ||
    c.includes("phone") ||
    c.includes("accessories")
  )
    return "Electronics";
  if (c.includes("auto") || c.includes("motor") || c.includes("winch"))
    return "Auto";
  return "Lifestyle";
}

export function groupLabel(group: CatalogGroup, lang: Lang): string {
  const key =
    group === "Pet"
      ? "catPet"
      : group === "Kitchen"
        ? "catKitchen"
        : group === "Home"
          ? "catHome"
          : group === "Electronics"
            ? "catElectronics"
            : group === "Auto"
              ? "catAuto"
              : "catLifestyle";
  return t(key, lang);
}

export const ALL_GROUPS: CatalogGroup[] = [
  "Pet",
  "Kitchen",
  "Home",
  "Electronics",
  "Auto",
  "Lifestyle",
];
