export interface Article {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  thumbnailUrl: string;
  sourceUrl: string;
  sourceName: string;
  categoryName: string;
  categorySlug: string;
  publishedAt: string;
  status: string;
  viewCount: number;
  metadata: Record<string, any>;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  parentId: number | null;
  sortOrder: number;
  active: boolean;
  autoCreated: boolean;
  articleCount: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  username: string;
  role: string;
}

export interface DashboardData {
  totalArticles: number;
  totalCategories: number;
  totalUsers: number;
  todayViews: number;
  viewsToday: number;
  articlesToday: number;
  sourceBreakdown: { source: string; count: number }[];
  viewsByDay: { date: string; views: number }[];
  recentCrawlLogs: { id: number; sourceName: string; articlesFound: number; errorCount: number; status: string; createdAt: string }[];
}
