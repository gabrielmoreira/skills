import { buildPartnerFeed } from "./partner-feed";

jest.mock("./catalogue-client", () => ({
  fetchCatalogue: jest.fn().mockResolvedValue({
    rows: [
      { sku: "A1", display: { title: { long: "Long name" } }, pricing: { amount: 10, currency: "EUR" }, stock: 3, categoryCode: "SHOES" },
      { sku: "B2", pricing: { amount: 20, currency: "EUR" }, stock: 0, categoryCode: "BAGS" },
    ],
  }),
}));

test("maps rows to partner items", async () => {
  const feed = await buildPartnerFeed("p-1");
  expect(feed).toHaveLength(2);
  expect(feed[0].title).toBe("Long name");
  expect(feed[1].available).toBe(false);
});
