import { ROLE_TYPES } from "./domain";

export const SWEDEN_VIEW = { center: [62.0, 15.5] as [number, number], zoom: 5 };
export const CITY_VIEWS: Record<string, { label: string; center: [number, number]; zoom: number }> = {
  linkoping: { label: "Linköping", center: [58.41, 15.62], zoom: 11 },
  stockholm: { label: "Stockholm", center: [59.33, 18.0], zoom: 10 },
  gothenburg: { label: "Gothenburg", center: [57.71, 11.97], zoom: 11 },
};

export function roleColor(role: string): string {
  const i = (ROLE_TYPES as readonly string[]).indexOf(role);
  return `var(--role-${(i < 0 ? 0 : i) + 1})`;
}

export type MapJob = { id: string; title: string; company: string; role: string; lat: number; lng: number; label: string };
export type MapCompany = { slug: string; name: string; industry: string; lat: number; lng: number; roles: string[] };
export type Bounds = { n: number; s: number; e: number; w: number };
