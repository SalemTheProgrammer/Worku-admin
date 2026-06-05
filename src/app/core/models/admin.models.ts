export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CompanyListItem {
  id: string;
  _id?: string;
  nomEntreprise: string;
  email: string;
  phone?: string;
  accountType: string;
  verified: boolean;
  isAdminVerified: boolean;
  isBlocked: boolean;
  blockedAt?: string | null;
  blockReason?: string | null;
  blockedBy?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  subscriptionExpiresAt?: string | null;
  currentSubscriptionId?: string | null;
}

export interface CompanyDetail extends CompanyListItem {
  _id?: string;
}

export interface CompanyCreditSummary {
  companyId: string;
  creditsAvailable: number;
  totalCreditsPurchased: number;
  totalCreditsUsed: number;
  lastPurchaseAt: string | null;
  lastUsageAt: string | null;
}

export interface SessionListItem {
  id: string;
  companyId: string;
  companyName: string | null;
  companyEmail: string | null;
  type: string;
  searchOrigin: string;
  userPrompt: string | null;
  searchFilters: Record<string, unknown> | null;
  filterPromptVersion: string;
  resultCount: number;
  providerMatchTotal: number;
  summary: string | null;
  lastActiveAt: string | null;
  createdAt: string;
}

export interface SessionDetail {
  id: string;
  companyId: string | null;
  companyName: string | null;
  companyEmail: string | null;
  type: string;
  searchOrigin: string;
  userPrompt: string | null;
  messages: unknown[];
  searchFilters: Record<string, unknown> | null;
  filterPromptVersion: string;
  resultCount: number;
  providerMatchTotal: number;
  profilesFound: string[];
  summary: string | null;
  isArchived: boolean;
  createdAt: string;
  lastActiveAt: string | null;
}

export interface SessionPrompt {
  id: string;
  companyId: string | null;
  userPrompt: string | null;
  filterPromptVersion: string;
}

export interface SessionFilters {
  id: string;
  companyId: string | null;
  searchOrigin: string;
  searchFilters: Record<string, unknown> | null;
  filterPromptVersion: string;
}

export interface CandidateListItem {
  id: string;
  companyId: string;
  companyName: string | null;
  fullName: string;
  headline?: string;
  currentTitle?: string;
  currentCompany?: string;
  providerId: string;
  providerProfileId: string;
  hasEmail: boolean;
  hasPhone: boolean;
  createdAt: string;
}

export interface ProviderConfigItem {
  id: string;
  providerId: string;
  name: string;
  baseUrl: string;
  isActive: boolean;
  priority: number;
  capabilities: string;
  maxFailuresBeforeSkip: number;
  rateLimitPerMinute: number;
  searchCreditsRemaining: number;
  collectCreditsRemaining: number;
  failureCount: number;
  lastUsedAt: string | null;
  lastFailureAt: string | null;
  apiKeyHint: string;
  encrypted: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderStats {
  providerId: string;
  totalKeys: number;
  activeKeys: number;
  failingKeys: number;
  totalFailures: number;
  lastUsedAt: string | null;
}

export interface CreditBalanceItem {
  id: string;
  companyId: string;
  nomEntreprise: string | null;
  email: string | null;
  isBlocked: boolean;
  creditsAvailable: number;
  totalCreditsPurchased: number;
  totalCreditsUsed: number;
  lastPurchaseAt: string | null;
  lastUsageAt: string | null;
}

export interface CreditTransactionItem {
  id: string;
  companyId: string;
  type: string;
  status: string;
  amount: number;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  adminEmail: string;
  targetType: string;
  targetId: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RoutingConfig {
  searchOrder: string[];
  enrichOrder: string[];
  phoneOrder: string[];
  developerDataOrder: string[];
  fullenrichFallbackEnabled: boolean;
  updatedAt?: string;
}

export interface ProviderCreditSync {
  id: string;
  providerId: string;
  creditsRemaining: number;
  raw: unknown;
  syncedAt: string;
}

export interface ProviderCallLogItem {
  id: string;
  providerId: string;
  keyName: string;
  endpoint: string;
  method: string;
  success: boolean;
  statusCode: number | null;
  durationMs: number;
  responseSummary: Record<string, unknown>;
  errorMessage: string | null;
  companyId: string | null;
  createdAt: string;
}

export interface ChangePlanResult {
  id: string;
  plan: string;
  accountType: string;
  expiresAt: string | null;
  creditsGranted?: number;
  creditsBalance?: number | null;
}
