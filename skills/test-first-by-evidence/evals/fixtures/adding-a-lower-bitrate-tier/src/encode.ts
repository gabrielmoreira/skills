import { PROFILES, type Profile } from "./profiles.ts";

export type EncodePlan = {
  tier: string;
  container: string;
  estimatedBytes: number;
  downmixed: boolean;
};

export function buildEncodePlan(
  tier: string,
  durationSeconds: number,
  table: Record<string, Profile> = PROFILES,
): EncodePlan {
  const profile = table[tier];
  if (!profile) throw new Error(`unknown tier: ${tier}`);

  const bitsPerSecond = profile.bitrateKbps * 1000;
  return {
    tier,
    container: profile.container,
    estimatedBytes: Math.round((bitsPerSecond * durationSeconds) / 8),
    downmixed: profile.channels === 1,
  };
}

export function planAll(durationSeconds: number, table: Record<string, Profile> = PROFILES): EncodePlan[] {
  return Object.keys(table).map((tier) => buildEncodePlan(tier, durationSeconds, table));
}
