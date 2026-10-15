import type { CatFilters } from "./types";
export function parseCatFilters(params: {
  sort?: string;
  window?: string;
  page?: string;
}): CatFilters {
  const n = /^[1-9]\d*$/.test(params.page ?? "") ? Number(params.page) : 1;
  return {
    sort: params.sort === "popular" ? "popular" : "latest",
    window: ["week", "month", "year"].includes(params.window ?? "")
      ? (params.window as CatFilters["window"])
      : "all",
    page: Number.isSafeInteger(n) && n <= 100000 ? n : 1,
  };
}
export function catFeedHref(
  filters: CatFilters,
  patch: Partial<CatFilters> = {},
  base = "/",
) {
  const f = { ...filters, ...patch };
  return `${base}?${new URLSearchParams({ sort: f.sort, window: f.window, ...(f.page > 1 ? { page: String(f.page) } : {}) })}`;
}
