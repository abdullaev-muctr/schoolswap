export const CATEGORIES = ['Textbooks', 'School supplies', 'Electronics', 'Clothing', 'Other'] as const;
export type Category = (typeof CATEGORIES)[number];

export const CONDITIONS = ['New', 'Like new', 'Good', 'Fair'] as const;
export type Condition = (typeof CONDITIONS)[number];

export const NEWS_SECTIONS = ['Notices', 'Events', 'Announcements', 'Achievements'] as const;
export type NewsSection = (typeof NEWS_SECTIONS)[number];

export const MAX_PHOTOS = 5;
export const PASSWORD_MIN = 8;

/**
 * Updates arrive instantly over Supabase Realtime. This slow background re-check is only
 * a safety net for networks that block WebSockets (some school Wi-Fi does).
 */
export const FALLBACK_POLL_MS = 30_000;
