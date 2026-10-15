import { expect, it } from "vitest";
import { parseCatFilters } from "./filters";
it("defaults invalid filters and prevents unbounded offsets", () => {
  expect(parseCatFilters({})).toEqual({
    sort: "latest",
    window: "all",
    page: 1,
  });
  expect(
    parseCatFilters({ sort: "popular", window: "week", page: "2" }),
  ).toEqual({ sort: "popular", window: "week", page: 2 });
  for (const page of [
    "0",
    "-2",
    "1.5",
    "Infinity",
    "100001",
    "999999999999",
    "1e2",
    "",
  ])
    expect(parseCatFilters({ sort: "bad", window: "bad", page })).toEqual({
      sort: "latest",
      window: "all",
      page: 1,
    });
  expect(parseCatFilters({ window: "month", page: "100000" })).toEqual({
    sort: "latest",
    window: "month",
    page: 100000,
  });
});
