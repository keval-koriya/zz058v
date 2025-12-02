/**
 * Channel data model representing YouTube channel information
 * synced from the external API via GitHub Actions
 */
export interface Channel {
  id: number;
  savedChannelId: string | null;
  isRevealed: boolean | null;
  title: string;
  thumbnailUrl: string;
  bannerUrl: string | null;
  lastScrapedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  subscribers: number;
  avgViewPerVideo: number;
  medianViewPerVideo: number;
  daysSinceStart: number;
  numOfUploads: number;
  isMonetized: boolean;
  rpm: number;
  avgMonthlyRevenue: number;
  categories: string[];
  category: string | null;
  format: string | null;
  isFaceless: boolean;
  quality: 'low' | 'mid' | 'high';
  avgMonthlyViews: number;
  totalViews: number;
  totalRevenueGenerated: number;
  daysSinceLastUpload: number;
  hasShorts: boolean;
  avgVideoLength: number;
  outlierScore: number;
  savedNote: string | null;
  url: string;
  avgMonthlyUploadFrequency: number;
  // Added by sync workflow
  lastUpdated?: unknown;
  fetchedAt?: string;
}

/**
 * Filter state for the channels table
 */
export interface ChannelFilters {
  search: string;
  categories: string[];
  quality: string[];
  isMonetized: boolean | null;
  isFaceless: boolean | null;
  hasShorts: boolean | null;
  minSubscribers: number | null;
  maxSubscribers: number | null;
  minRevenue: number | null;
  maxRevenue: number | null;
}

/**
 * Aggregated statistics for channels
 */
export interface ChannelStats {
  totalChannels: number;
  totalSubscribers: number;
  avgSubscribers: number;
  totalRevenue: number;
  avgMonthlyRevenue: number;
  avgRpm: number;
  totalViews: number;
  monetizedCount: number;
  facelessCount: number;
}
