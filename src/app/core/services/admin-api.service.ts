import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuditLogItem,
  CandidateListItem,
  ChangePlanResult,
  ProviderCallLogItem,
  CompanyCreditSummary,
  CompanyDetail,
  CompanyListItem,
  CreditBalanceItem,
  CreditTransactionItem,
  Paginated,
  ProviderConfigItem,
  ProviderCreditSync,
  ProviderStats,
  RoutingConfig,
  SessionDetail,
  SessionFilters,
  SessionListItem,
  SessionPrompt,
} from '../models/admin.models';

type ApiEnvelope<T> =
  | T
  | {
      success: boolean;
      statusCode: number;
      message: string;
      data: T;
      timestamp: string;
    };

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  // System
  getFilterPromptVersion(): Observable<{ version: string }> {
    return this.get<{ version: string }>('/admin/system/filter-prompt-version');
  }

  getProviderOrder(): Observable<{ order: string[] }> {
    return this.get<{ order: string[] }>('/admin/system/provider-order');
  }

  // Companies
  listCompanies(params: Record<string, string | number | boolean | undefined>): Observable<Paginated<CompanyListItem>> {
    return this.get<Paginated<CompanyListItem>>('/admin/companies', params);
  }

  getCompany(id: string): Observable<CompanyDetail> {
    return this.get<CompanyDetail>(`/admin/companies/${id}`);
  }

  blockCompany(id: string, reason: string): Observable<unknown> {
    return this.post<unknown>(`/admin/companies/${id}/block`, { reason });
  }

  unblockCompany(id: string): Observable<unknown> {
    return this.post<unknown>(`/admin/companies/${id}/unblock`, {});
  }

  setCompanyVerified(id: string, verified: boolean): Observable<unknown> {
    return this.patch<unknown>(`/admin/companies/${id}/verify`, { verified });
  }

  // Sessions
  listSessions(params: Record<string, string | number | undefined>): Observable<Paginated<SessionListItem>> {
    return this.get<Paginated<SessionListItem>>('/admin/sessions', params);
  }

  getSession(id: string): Observable<SessionDetail> {
    return this.get<SessionDetail>(`/admin/sessions/${id}`);
  }

  getSessionFilters(id: string): Observable<SessionFilters> {
    return this.get<SessionFilters>(`/admin/sessions/${id}/filters`);
  }

  getSessionPrompt(id: string): Observable<SessionPrompt> {
    return this.get<SessionPrompt>(`/admin/sessions/${id}/prompt`);
  }

  // Candidates
  listCandidates(params: Record<string, string | number | undefined>): Observable<Paginated<CandidateListItem>> {
    return this.get<Paginated<CandidateListItem>>('/admin/candidates', params);
  }

  listSessionCandidates(
    sessionId: string,
    params: Record<string, string | number | undefined>,
  ): Observable<Paginated<CandidateListItem>> {
    return this.get<Paginated<CandidateListItem>>(
      `/admin/sessions/${sessionId}/candidates`,
      params,
    );
  }

  getCandidate(id: string): Observable<Record<string, unknown>> {
    return this.get<Record<string, unknown>>(`/admin/candidates/${id}`);
  }

  // Providers
  listProviders(providerId?: string): Observable<ProviderConfigItem[]> {
    return this.get<ProviderConfigItem[]>('/admin/providers', { providerId });
  }

  getProviderStats(): Observable<ProviderStats[]> {
    return this.get<ProviderStats[]>('/admin/providers/stats');
  }

  createProvider(body: Record<string, unknown>): Observable<ProviderConfigItem> {
    return this.post<ProviderConfigItem>('/admin/providers', body);
  }

  updateProvider(id: string, body: Record<string, unknown>): Observable<ProviderConfigItem> {
    return this.patch<ProviderConfigItem>(`/admin/providers/${id}`, body);
  }

  deleteProvider(id: string): Observable<unknown> {
    return this.delete<unknown>(`/admin/providers/${id}`);
  }

  testProvider(id: string): Observable<{ ok: boolean; status?: number; message?: string }> {
    return this.post<{ ok: boolean; status?: number; message?: string }>(
      `/admin/providers/${id}/test`,
      {},
    );
  }

  reorderProviders(items: Array<{ id: string; priority: number }>): Observable<unknown> {
    return this.post<unknown>('/admin/providers/reorder', { items });
  }

  syncProviderCredits(id: string): Observable<ProviderCreditSync> {
    return this.post<ProviderCreditSync>(`/admin/providers/${id}/sync-credits`, {});
  }

  resetProviderFailures(id: string): Observable<{ id: string; failureCount: 0 }> {
    return this.post<{ id: string; failureCount: 0 }>(`/admin/providers/${id}/reset-failures`, {});
  }

  getProviderCallLogs(params: { providerId?: string; success?: boolean; limit?: number; offset?: number } = {}):
    Observable<{ items: ProviderCallLogItem[]; total: number; limit: number; offset: number }> {
    return this.get(`/admin/providers/call-logs`, params as any);
  }

  clearProviderCallLogs(): Observable<{ deleted: number }> {
    return this.post<{ deleted: number }>('/admin/providers/call-logs/clear', {});
  }

  cleanupCoresignal(): Observable<{ deleted: number }> {
    return this.post<{ deleted: number }>('/admin/providers/cleanup-coresignal', {});
  }

  // Routing config
  getRoutingConfig(): Observable<RoutingConfig> {
    return this.get<RoutingConfig>('/admin/system/routing');
  }

  updateRoutingConfig(patch: Partial<RoutingConfig>): Observable<RoutingConfig> {
    return this.patch<RoutingConfig>('/admin/system/routing', patch);
  }

  // Credits
  listCreditBalances(params: Record<string, string | number | undefined>): Observable<Paginated<CreditBalanceItem>> {
    return this.get<Paginated<CreditBalanceItem>>('/admin/credits', params);
  }

  getCompanyCredits(id: string): Observable<CompanyCreditSummary> {
    return this.get<CompanyCreditSummary>(`/admin/companies/${id}/credits`);
  }

  grantCredits(id: string, amount: number, reason: string): Observable<{ balance: number; transactionId: string }> {
    return this.post<{ balance: number; transactionId: string }>(
      `/admin/companies/${id}/credits/grant`,
      { amount, reason },
    );
  }

  deductCredits(id: string, amount: number, reason: string): Observable<{ balance: number; transactionId: string }> {
    return this.post<{ balance: number; transactionId: string }>(
      `/admin/companies/${id}/credits/deduct`,
      { amount, reason },
    );
  }

  listCreditTransactions(
    params: Record<string, string | number | undefined>,
  ): Observable<Paginated<CreditTransactionItem>> {
    return this.get<Paginated<CreditTransactionItem>>('/admin/credits/transactions', params);
  }

  // Company delete
  deleteCompany(id: string): Observable<{ deleted: number }> {
    return this.delete<{ deleted: number }>(`/admin/companies/${id}`);
  }

  bulkDeleteCompanies(ids: string[]): Observable<{ deleted: number }> {
    return this.post<{ deleted: number }>('/admin/companies/bulk-delete', { ids });
  }

  // Candidate delete
  deleteCandidate(id: string): Observable<{ deleted: number }> {
    return this.delete<{ deleted: number }>(`/admin/candidates/${id}`);
  }

  bulkDeleteCandidates(ids: string[]): Observable<{ deleted: number }> {
    return this.post<{ deleted: number }>('/admin/candidates/bulk-delete', { ids });
  }

  // Company plan change
  changeCompanyPlan(id: string, plan: string, expiresAt?: string | null): Observable<ChangePlanResult> {
    return this.post<ChangePlanResult>(`/admin/companies/${id}/change-plan`, { plan, expiresAt: expiresAt ?? null });
  }

  // Audit
  listAuditLogs(params: Record<string, string | number | undefined>): Observable<Paginated<AuditLogItem>> {
    return this.get<Paginated<AuditLogItem>>('/admin/audit-logs', params);
  }

  private get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Observable<T> {
    return this.http
      .get<ApiEnvelope<T>>(`${this.base}${path}`, {
        params: params ? this.toParams(params) : undefined,
      })
      .pipe(map((response) => this.unwrap(response)));
  }

  private post<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .post<ApiEnvelope<T>>(`${this.base}${path}`, body)
      .pipe(map((response) => this.unwrap(response)));
  }

  private patch<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .patch<ApiEnvelope<T>>(`${this.base}${path}`, body)
      .pipe(map((response) => this.unwrap(response)));
  }

  private delete<T>(path: string): Observable<T> {
    return this.http
      .delete<ApiEnvelope<T>>(`${this.base}${path}`)
      .pipe(map((response) => this.unwrap(response)));
  }

  private unwrap<T>(response: ApiEnvelope<T>): T {
    if (
      response &&
      typeof response === 'object' &&
      'data' in response &&
      ('success' in response || 'statusCode' in response || 'timestamp' in response)
    ) {
      return response.data as T;
    }

    return response as T;
  }

  private toParams(params: Record<string, string | number | boolean | undefined>): HttpParams {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return httpParams;
  }
}
