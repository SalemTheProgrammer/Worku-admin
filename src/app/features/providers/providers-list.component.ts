import { CommonModule, KeyValuePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProviderCallLogItem, ProviderConfigItem, ProviderStats, RoutingConfig } from '../../core/models/admin.models';
import { AdminApiService } from '../../core/services/admin-api.service';

type MainTab = 'providers' | 'routing' | 'ai' | 'logs';

interface ProviderSummaryCard {
  providerId: string;
  label: string;
  docsUrl: string;
  totalKeys: number;
  activeKeys: number;
  failingKeys: number;
  searchCreditsRemaining: number;
  collectCreditsRemaining: number;
}

const PROVIDER_LABELS: Record<string, string> = {
  contactout: 'ContactOut',
  fullenrich: 'FullEnrich',
  openai: 'OpenAI',
  peopledatalabs: 'People Data Labs',
};

const PROVIDER_DOCS: Record<string, string> = {
  contactout: 'https://api.contactout.com/',
  fullenrich: 'https://docs.fullenrich.com/api/v2/general/credit',
  openai: 'https://platform.openai.com/docs/api-reference/usage',
  peopledatalabs: 'https://docs.peopledatalabs.com/docs/company-search-api',
};


@Component({
  selector: 'app-providers-list',
  standalone: true,
  imports: [CommonModule, FormsModule, KeyValuePipe],
  templateUrl: './providers-list.component.html',
  styleUrl: './providers-list.component.css',
})
export class ProvidersListComponent implements OnInit {
  private readonly api = inject(AdminApiService);

  // ── State ──
  items = signal<ProviderConfigItem[]>([]);
  stats = signal<ProviderStats[]>([]);
  routing = signal<RoutingConfig | null>(null);
  loading = signal(true);
  routingLoading = signal(false);
  showForm = signal(false);
  testingId = signal<string | null>(null);
  syncingId = signal<string | null>(null);
  resettingId = signal<string | null>(null);
  testResult = signal<string | null>(null);
  syncResult = signal<{ id: string; raw: unknown; extra?: Record<string, number> } | null>(null);
  activeTab = signal<MainTab>('providers');
  routingSaveMsg = signal<string | null>(null);

  // Logs tab
  logs = signal<ProviderCallLogItem[]>([]);
  logsTotal = signal(0);
  logsLoading = signal(false);
  logsFilter = signal<'all' | 'ok' | 'err'>('all');
  logsPage = signal(0);
  readonly LOGS_LIMIT = 50;
  cleanupMsg = signal<string | null>(null);

  // Routing edit draft
  routingDraft = signal<RoutingConfig>({
    searchOrder: ['contactout', 'fullenrich'],
    enrichOrder: ['contactout', 'fullenrich'],
    phoneOrder: ['contactout', 'fullenrich'],
    developerDataOrder: ['contactout'],
    fullenrichFallbackEnabled: true,
  });

  form = this.emptyForm('contactout');

  readonly PROVIDER_LABELS = PROVIDER_LABELS;
  readonly Math = Math;

  readonly providerOptions = computed(() =>
    this.activeTab() === 'ai'
      ? ['openai']
      : ['contactout', 'fullenrich', 'peopledatalabs'],
  );

  readonly visibleItems = computed(() => {
    const allowed = new Set(this.providerOptions());
    return this.items().filter((item) => allowed.has(item.providerId));
  });

  readonly providerCards = computed<ProviderSummaryCard[]>(() =>
    this.providerOptions().map((providerId) => {
      const keys = this.items().filter((item) => item.providerId === providerId);
      const stats = this.stats().find((item) => item.providerId === providerId);
      return {
        providerId,
        label: PROVIDER_LABELS[providerId] ?? providerId,
        docsUrl: PROVIDER_DOCS[providerId] ?? '#',
        totalKeys: stats?.totalKeys ?? keys.length,
        activeKeys: stats?.activeKeys ?? keys.filter((k) => k.isActive).length,
        failingKeys:
          stats?.failingKeys ??
          keys.filter((k) => k.failureCount >= k.maxFailuresBeforeSkip).length,
        searchCreditsRemaining: keys.reduce(
          (s, k) => s + (Number.isFinite(k.searchCreditsRemaining) ? k.searchCreditsRemaining : 0),
          0,
        ),
        collectCreditsRemaining: keys.reduce(
          (s, k) => s + (Number.isFinite(k.collectCreditsRemaining) ? k.collectCreditsRemaining : 0),
          0,
        ),
      };
    }),
  );

  ngOnInit(): void {
    this.reload();
    this.loadRouting();
  }

  reload(): void {
    this.loading.set(true);
    this.api.listProviders().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.api.getProviderStats().subscribe((stats) => this.stats.set(stats));
  }

  loadRouting(): void {
    this.api.getRoutingConfig().subscribe({
      next: (cfg) => {
        this.routing.set(cfg);
        this.routingDraft.set({ ...cfg });
      },
    });
  }

  selectTab(tab: MainTab): void {
    this.activeTab.set(tab);
    this.showForm.set(false);
    this.testResult.set(null);
    this.syncResult.set(null);
    if (tab === 'logs') { this.loadLogs(); }
    if (!['routing', 'logs'].includes(tab) && !this.providerOptions().includes(this.form.providerId)) {
      this.form = this.emptyForm(this.providerOptions()[0]);
    }
  }

  // ── Logs ──

  loadLogs(): void {
    this.logsLoading.set(true);
    const f = this.logsFilter();
    const success = f === 'all' ? undefined : f === 'ok';
    this.api.getProviderCallLogs({ success, limit: this.LOGS_LIMIT, offset: this.logsPage() * this.LOGS_LIMIT }).subscribe({
      next: (res) => {
        this.logs.set(res.items);
        this.logsTotal.set(res.total);
        this.logsLoading.set(false);
      },
      error: () => this.logsLoading.set(false),
    });
  }

  setLogsFilter(f: 'all' | 'ok' | 'err'): void {
    this.logsFilter.set(f);
    this.logsPage.set(0);
    this.loadLogs();
  }

  logsNextPage(): void { this.logsPage.update(p => p + 1); this.loadLogs(); }
  logsPrevPage(): void { this.logsPage.update(p => Math.max(0, p - 1)); this.loadLogs(); }

  clearLogs(): void {
    if (!confirm('Supprimer tous les logs ?')) return;
    this.api.clearProviderCallLogs().subscribe({
      next: (r) => { this.cleanupMsg.set(`✓ ${r.deleted} logs supprimés`); this.loadLogs(); },
      error: () => this.cleanupMsg.set('✗ Erreur'),
    });
  }

  cleanupCoresignal(): void {
    this.api.cleanupCoresignal().subscribe({
      next: (r) => this.cleanupMsg.set(`✓ ${r.deleted} document(s) CoreSignal supprimés`),
      error: () => this.cleanupMsg.set('✗ Erreur'),
    });
  }

  logDuration(ms: number): string {
    return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
  }

  logEndpointShort(endpoint: string): string {
    return endpoint.replace(/^https?:\/\/[^/]+/, '').slice(0, 40) || endpoint;
  }

  openAddForm(providerId = this.providerOptions()[0]): void {
    this.form = this.emptyForm(providerId);
    this.showForm.set(true);
    this.testResult.set(null);
  }

  create(): void {
    if (!this.form.name.trim() || !this.form.apiKey.trim()) return;
    this.testResult.set(null);
    this.api.createProvider({ ...this.form }).subscribe({
      next: () => {
        this.showForm.set(false);
        this.form = this.emptyForm(this.providerOptions()[0]);
        this.reload();
      },
      error: (err) => {
        this.testResult.set(err?.error?.message ?? 'Impossible d\'ajouter cette clé.');
      },
    });
  }

  test(id: string): void {
    this.testingId.set(id);
    this.testResult.set(null);
    this.api.testProvider(id).subscribe({
      next: (result) => {
        this.testResult.set(result.ok ? '✓ Connexion OK' : `✗ Échec: ${result.message ?? result.status}`);
        this.testingId.set(null);
        this.reload();
      },
      error: () => {
        this.testResult.set('✗ Erreur réseau');
        this.testingId.set(null);
      },
    });
  }

  syncCredits(id: string): void {
    this.syncingId.set(id);
    this.syncResult.set(null);
    this.api.syncProviderCredits(id).subscribe({
      next: (result: any) => {
        this.syncResult.set({ id, raw: result.raw, extra: result.extra });
        this.syncingId.set(null);
        this.reload();
      },
      error: (err) => {
        this.testResult.set(err?.error?.message ?? '✗ Impossible de synchroniser les crédits.');
        this.syncingId.set(null);
      },
    });
  }

  resetFailures(id: string): void {
    this.resettingId.set(id);
    this.api.resetProviderFailures(id).subscribe({
      next: () => {
        this.resettingId.set(null);
        this.reload();
      },
      error: () => this.resettingId.set(null),
    });
  }

  deactivate(id: string): void {
    if (!confirm('Désactiver cette clé ?')) return;
    this.api.deleteProvider(id).subscribe(() => this.reload());
  }

  toggleActive(item: ProviderConfigItem): void {
    this.api.updateProvider(item.id, { isActive: !item.isActive }).subscribe(() => this.reload());
  }

  bumpPriority(item: ProviderConfigItem, delta: number): void {
    const next = Math.max(1, item.priority + delta);
    this.api.updateProvider(item.id, { priority: next }).subscribe(() => this.reload());
  }

  // ── Routing config ──

  moveProvider(orderField: keyof RoutingConfig, providerId: string, dir: -1 | 1): void {
    const draft = { ...this.routingDraft() };
    const arr = [...(draft[orderField] as string[])];
    const idx = arr.indexOf(providerId);
    if (idx === -1) return;
    const next = idx + dir;
    if (next < 0 || next >= arr.length) return;
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    (draft as any)[orderField] = arr;
    this.routingDraft.set(draft);
  }

  saveRouting(): void {
    this.routingLoading.set(true);
    this.routingSaveMsg.set(null);
    this.api.updateRoutingConfig(this.routingDraft()).subscribe({
      next: (cfg) => {
        this.routing.set(cfg);
        this.routingDraft.set({ ...cfg });
        this.routingLoading.set(false);
        this.routingSaveMsg.set('✓ Configuration sauvegardée');
        setTimeout(() => this.routingSaveMsg.set(null), 3000);
      },
      error: (err) => {
        this.routingSaveMsg.set(err?.error?.message ?? '✗ Erreur lors de la sauvegarde');
        this.routingLoading.set(false);
      },
    });
  }

  toggleFallback(): void {
    const d = this.routingDraft();
    this.routingDraft.set({ ...d, fullenrichFallbackEnabled: !d.fullenrichFallbackEnabled });
  }

  // ── Helpers ──

  formatCredits(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value);
  }

  isFailingKey(item: ProviderConfigItem): boolean {
    return item.failureCount >= item.maxFailuresBeforeSkip;
  }

  isSyncing(id: string): boolean {
    return this.syncingId() === id;
  }

  isTesting(id: string): boolean {
    return this.testingId() === id;
  }

  isResetting(id: string): boolean {
    return this.resettingId() === id;
  }

  rawJson(data: unknown): string {
    try { return JSON.stringify(data, null, 2); } catch { return String(data); }
  }

  private emptyForm(providerId: string) {
    return {
      providerId,
      name: '',
      apiKey: '',
      priority: 10,
      notes: '',
      searchCreditsRemaining: 0,
      collectCreditsRemaining: 0,
    };
  }

  /** Return the order array for a given routing field from the current draft */
  draftOrder(field: 'searchOrder' | 'enrichOrder' | 'phoneOrder' | 'developerDataOrder'): string[] {
    return this.routingDraft()[field] ?? [];
  }
}
