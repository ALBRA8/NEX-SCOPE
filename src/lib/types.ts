export type ViewType =
  | 'dashboard'
  | 'niche-finder'
  | 'trends'
  | 'channel-analyzer'
  | 'content-gap'
  | 'monetization'
  | 'competitor-matrix'
  | 'content-plan'
  | 'keyword-explorer'
  | 'video-studio'
  | 'feed-simulator'
  | 'seo-audit'
  | 'ad-spy'
  | 'product-spy'
  | 'breakout-channels'
  | 'thumbnail-analyzer'
  | 'ai-chat'
  | 'settings';

export type CompetitionLevel = 'bajo' | 'medio' | 'alto';

export type CategoryType =
  | 'Tecnología'
  | 'Finanzas'
  | 'Salud'
  | 'Entretenimiento'
  | 'Educación'
  | 'Gaming'
  | 'Cocina'
  | 'Viajes'
  | 'Moda'
  | 'Productividad'
  | 'Arte'
  | 'Música';

export interface Niche {
  id: string;
  name: string;
  category: string;
  nicheScore: number;
  subscriberRange: string;
  estimatedRPM: number;
  competitionLevel: CompetitionLevel;
  growthRate: number;
  monthlySearchVolume: number;
  trending: boolean;
  trendVelocity: number;
  description: string;
}

export interface Channel {
  id: string;
  name: string;
  niche: string;
  subscribers: number;
  totalViews: number;
  videoCount: number;
  avgViews: number;
  engagementRate: number;
  uploadFrequency: string;
  estimatedRevenue: number;
  growthHistory: number[];
  topVideos: TopVideo[];
  avatar: string;
  joinDate: string;
}

export interface TopVideo {
  title: string;
  views: number;
  engagement: number;
}

export interface Keyword {
  id: string;
  keyword: string;
  volume: number;
  competition: number;
  cpc: number;
  trend: number[];
  relatedKeywords: string[];
}

export interface ContentGap {
  topic: string;
  searchVolume: number;
  existingVideos: number;
  opportunityScore: number;
  suggestedTitle: string;
}

export interface VideoIdea {
  title: string;
  description: string;
  keywords: string[];
  estimatedViews: number;
  difficulty: 'fácil' | 'medio' | 'difícil';
  format: string;
  week: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface TrendData {
  month: string;
  [key: string]: string | number;
}

export interface MonthlyRevenue {
  month: string;
  ads: number;
  sponsorships: number;
  affiliate: number;
  memberships: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONTRATO PUENTE CON YOUTUBE AUTOMATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface AutomationExportPayload {
  title: string;
  hook: string;
  idea_summary: string;
  target_rpm: number;
  reference_url?: string;
  recommended_mode: 'idea' | 'script' | 'url' | 'audio';
  target_format: 'short' | 'long';
  generated_at?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DETECTOR DE VIDEOS OUTLIERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type OutlierTier = 'EXTREMO_50X' | 'ALTO_20X' | 'VIRAL_10X' | 'NORMAL';

export interface OutlierVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  views: number;
  channelSubscribers: number;
  outlierMultiplier: number; // views / subscribers
  outlierTier: OutlierTier;
  url: string;
  hookSnippet?: string;
  structureSnippet?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CATÁLOGO DE MONETIZACIÓN POR RPM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type RPMTierLevel = 'Tier 1' | 'Tier 2' | 'Tier 3';

export interface RPMTierCategory {
  tier: RPMTierLevel;
  rpmRange: string;
  minRpm: number;
  maxRpm: number;
  niches: string[];
  description: string;
  advertisers: string;
}

export interface NichePivotSuggestion {
  originalTopic: string;
  highRpmAngle: string;
  hook: string;
  targetTier: RPMTierLevel;
  estimatedRpm: number;
  monetizationReason: string;
}
