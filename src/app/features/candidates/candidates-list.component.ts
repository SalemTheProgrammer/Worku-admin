import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CandidateListItem } from '../../core/models/admin.models';
import { AdminApiService } from '../../core/services/admin-api.service';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-candidates-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
  templateUrl: './candidates-list.component.html',
  styleUrl: './candidates-list.component.css',
})
export class CandidatesListComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  items = signal<CandidateListItem[]>([]);
  loading = signal(true);
  page = signal(1);
  total = signal(0);
  totalPages = signal(1);

  // Filters
  search = signal('');
  companyId = signal('');
  sessionId = signal('');
  filterProvider = signal('');
  filterHasEmail = signal('');
  filterHasPhone = signal('');
  filterFrom = signal('');
  filterTo = signal('');

  // Selection
  selected = signal<Set<string>>(new Set());
  deleteMsg = signal<string | null>(null);

  readonly PROVIDERS = ['contactout', 'fullenrich'];

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.page.set(Number(params.get('page') ?? 1));
      this.search.set(params.get('search') ?? '');
      this.companyId.set(params.get('companyId') ?? '');
      this.sessionId.set(params.get('sessionId') ?? '');
      this.filterProvider.set(params.get('providerId') ?? '');
      this.filterHasEmail.set(params.get('hasEmail') ?? '');
      this.filterHasPhone.set(params.get('hasPhone') ?? '');
      this.filterFrom.set(params.get('from') ?? '');
      this.filterTo.set(params.get('to') ?? '');
      this.selected.set(new Set());
      this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    this.api
      .listCandidates({
        page: this.page(),
        limit: 25,
        search: this.search() || undefined,
        companyId: this.companyId() || undefined,
        sessionId: this.sessionId() || undefined,
        providerId: this.filterProvider() || undefined,
        from: this.filterFrom() || undefined,
        to: this.filterTo() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.items.set(res.items);
          this.total.set(res.total);
          this.totalPages.set(res.totalPages);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  applyFilter(key: string, value: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [key]: value || null, page: 1 },
      queryParamsHandling: 'merge',
    });
  }

  applySearch(value: string): void { this.applyFilter('search', value); }

  clearFilters(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: null, providerId: null, hasEmail: null, hasPhone: null, from: null, to: null, companyId: null, sessionId: null, page: 1 },
      queryParamsHandling: 'merge',
    });
  }

  onPageChange(p: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: p },
      queryParamsHandling: 'merge',
    });
  }

  // Selection
  toggleSelect(id: string): void {
    const s = new Set(this.selected());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selected.set(s);
  }

  isSelected(id: string): boolean { return this.selected().has(id); }

  toggleAll(): void {
    const all = this.items().map(i => i.id);
    const s = this.selected();
    const allSelected = all.every(id => s.has(id));
    this.selected.set(allSelected ? new Set() : new Set(all));
  }

  get allSelected(): boolean {
    const ids = this.items().map(i => i.id);
    return ids.length > 0 && ids.every(id => this.selected().has(id));
  }

  // Delete
  deleteOne(id: string, name: string): void {
    if (!confirm(`Supprimer le profil "${name}" ? Irréversible.`)) return;
    this.api.deleteCandidate(id).subscribe({
      next: () => { this.deleteMsg.set('✓ Profil supprimé'); this.load(); },
      error: (e) => this.deleteMsg.set(e?.error?.message ?? '✗ Erreur'),
    });
  }

  bulkDelete(): void {
    const ids = [...this.selected()];
    if (!ids.length) return;
    if (!confirm(`Supprimer ${ids.length} profil(s) ? Irréversible.`)) return;
    this.api.bulkDeleteCandidates(ids).subscribe({
      next: (r) => { this.deleteMsg.set(`✓ ${r.deleted} profil(s) supprimé(s)`); this.selected.set(new Set()); this.load(); },
      error: (e) => this.deleteMsg.set(e?.error?.message ?? '✗ Erreur'),
    });
  }
}
