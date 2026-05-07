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
  category: CategoryType;
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
