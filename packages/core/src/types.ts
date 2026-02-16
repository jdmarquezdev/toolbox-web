export type CreatedVia = "admin" | "telegram" | "bookmarklet" | "api";
export type SourceType = "website" | "github" | "youtube" | "article" | "x" | "other";
export type PreviewStatus = "none" | "pending" | "ready" | "failed";
export type PricingType = "free" | "freemium" | "paid" | "unknown";
export type ToolStatus = "inbox" | "reviewed";
export type ModerationState = "inbox" | "relevant" | "archived" | "discarded";

export type ToolRow = {
  id: string;
  slug: string | null;
  url: string;
  originalUrl: string;
  createdVia: CreatedVia;
  sourceType: SourceType;
  title: string | null;
  description: string | null;
  faviconUrl: string | null;
  ogImageUrl: string | null;
  screenshotUrl: string | null;
  previewStatus: PreviewStatus;
  pricing: PricingType;
  oss: boolean;
  categoryId: string | null;
  status: ToolStatus;
  relevant: boolean | null;
  moderationState: ModerationState;
  moderationPosition: number;
  notesPrivate: string | null;
  notesPublic: string | null;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt: Date | null;
  lastSeenAt: Date | null;
  seenCount: number;
};

export type PublicFilters = {
  query?: string;
  category?: string;
  sourceType?: string;
  oss?: string;
  sort?: string;
};
