import { settings } from "./settings.js";

export function createApi(deps) {
  return {
    async quote(parcel) {
      const res = await deps.http.post(`${settings.partnerBaseUrl}/quotes`, parcel, {
        timeoutMs: settings.requestTimeoutMs,
      });
      return res.body;
    },
    async track(reference) {
      const res = await deps.http.get(`${settings.partnerBaseUrl}/parcels/${reference}`, {
        timeoutMs: settings.requestTimeoutMs,
      });
      return res.body;
    },
  };
}
