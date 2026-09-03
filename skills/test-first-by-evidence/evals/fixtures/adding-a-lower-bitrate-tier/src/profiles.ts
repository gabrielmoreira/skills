export type Profile = {
  bitrateKbps: number;
  sampleRateHz: number;
  channels: 1 | 2;
  container: "mp4" | "webm";
};

export const PROFILES: Record<string, Profile> = {
  "web-high": { bitrateKbps: 256, sampleRateHz: 48_000, channels: 2, container: "mp4" },
  "web-standard": { bitrateKbps: 128, sampleRateHz: 44_100, channels: 2, container: "mp4" },
  "mobile-standard": { bitrateKbps: 96, sampleRateHz: 44_100, channels: 2, container: "webm" },
};

export function getProfile(tier: string): Profile {
  const profile = PROFILES[tier];
  if (!profile) throw new Error(`unknown tier: ${tier}`);
  return profile;
}
