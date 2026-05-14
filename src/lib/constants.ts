/** Default number of rows per paginated list query */
export const PAGE_SIZE = 20

/** Default number of rows per detail page sub-list */
export const DETAIL_PAGE_SIZE = 10

/** Debounce delay for search inputs (ms) */
export const DEBOUNCE_DELAY_MS = 300

/** Milliseconds in one day — used for date math */
export const MS_PER_DAY = 1000 * 60 * 60 * 24

/** Scroll distance from bottom (px) that triggers infinite-load */
export const SCROLL_LOAD_THRESHOLD = 50

/** Minimum query length before a search request is fired */
export const MIN_SEARCH_LENGTH = 2

/** Dashboard auto-refetch interval (ms) — 5 minutes */
export const DASHBOARD_REFETCH_MS = 5 * 60 * 1000

/** Days in shop before a car is flagged with a warning badge */
export const DAYS_IN_SHOP_WARNING = 3

/** Default TanStack Query stale time (ms) — 5 minutes */
export const QUERY_STALE_MS = 5 * 60 * 1000
