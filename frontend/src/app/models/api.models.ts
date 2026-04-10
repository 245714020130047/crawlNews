// API response models matching backend DTOs

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface NewsSource {
  id: number;
  name: string;
  slug: string;
  baseUrl: string;
  homeUrl?: string;
  logoUrl?: string;
  description?: string;
  isActive: boolean;
  crawlIntervalMinutes: number;
  crawlCron?: string;
  parserAdapter?: string;
  lastCrawledAt?: string;
  lastSuccessAt?: string;
  consecutiveFailCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent?: Category;
  parentId?: number | null;
  icon?: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface NewsArticle {
  id: number;
  source: NewsSource;
  category?: Category;
  title: string;
  slug?: string;
  excerpt?: string;
  bodyHtml?: string;
  contentHtml?: string;
  contentText?: string;
  author?: string;
  imageUrl?: string;
  imageAlt?: string;
  tags?: string[];
  sourceUrl: string;
  publishedAt?: string;
  firstCrawledAt?: string;
  lastCrawledAt?: string;
  crawlCount: number;
  viewCount: number;
  status: 'ACTIVE' | 'HIDDEN' | 'DUPLICATE' | 'ARCHIVED';
  isSummarized: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewsSummary {
  id: number;
  article: NewsArticle;
  shortSummary?: string;
  standardSummary?: string;
  bulletSummary?: string;
  sentiment?: string;
  sentimentScore?: number;
  modelName?: string;
  modelVersion?: string;
  promptVersion?: string;
  triggerMode?: 'AUTO' | 'MANUAL';
  reviewStatus: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'EDITED';
  reviewedBy?: string;
  reviewedAt?: string;
  generatedAt?: string;
  tokenCount?: number;
  generationLatencyMs?: number;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SummaryJob {
  id: number;
  article: NewsArticle;
  priority: number;
  status: 'QUEUED' | 'PROCESSING' | 'DONE' | 'FAILED' | 'CANCELLED';
  triggerMode?: 'AUTO' | 'MANUAL';
  triggeredBy?: string;
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
  createdAt: string;
}

export interface CrawlJob {
  id: number;
  source: NewsSource;
  jobType: 'SCHEDULED' | 'MANUAL' | 'RETRY';
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'PARTIAL';
  articlesFound: number;
  articlesNew: number;
  articlesUpdated: number;
  articlesSkipped: number;
  articlesFailed: number;
  robotsChecked: boolean;
  robotsAllowed?: boolean;
  errorMessage?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  createdAt: string;
}

export interface HomePayload {
  hero: NewsArticle[];
  feed: NewsArticle[];
  trending: NewsArticle[];
  perSource: Record<string, NewsArticle[]>;
  sources: SourceHealthMini[];
}

export interface SourceHealthMini {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string;
  lastCrawledAt?: string;
  lastSuccessAt?: string;
  isActive: boolean;
}

export interface DashboardOverview {
  totalSources: number;
  activeSources: number;
  totalArticles: number;
  totalSummaries: number;
  pendingJobs: number;
  failedJobs: number;
  todayArticles?: number;
}

export interface CrawlMetrics {
  daily: Array<{ date: string; total: number; newArticles: number; failed: number }>;
}

export interface SummaryMetrics {
  totalSummarized: number;
  pendingJobs?: number;
  successRate: number;
  avgLatencyMs?: number;
}

export interface SourceHealthEntry {
  sourceId: number;
  sourceName: string;
  slug: string;
  isActive: boolean;
  isFailing: boolean;
  consecutiveFailCount: number;
  lastCrawledAt?: string;
  lastSuccessAt?: string;
}

export interface CrawlResult {
  id: number;
  crawlJob?: CrawlJob;
  articleUrl: string;
  resultType: 'NEW' | 'UPDATED' | 'SKIPPED' | 'FAILED' | 'DEDUPED';
  errorMessage?: string;
  createdAt: string;
}

export interface SummarySettings {
  autoSummaryEnabled: boolean;
  summaryDailyLimit: number;
}
