import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CompanyListItem } from '../../core/models/admin.models';
import { AdminApiService } from '../../core/services/admin-api.service';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-companies-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
  templateUrl: './companies-list.component.html',
})
export class CompaniesListComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  items = signal<CompanyListItem[]>([]);
  loading = signal(true);
  page = signal(1);
  total = signal(0);
  totalPages = signal(1);

  // Filters
  search = signal('');
  filterBlocked = signal('');
  filterAccountType = signal('');
  filterVerified = signal('');

  // Selection for bulk delete
  selected = signal<Set<string>>(new Set());
  deleteMsg = signal<string | null>(null);

  readonly ACCOUNT_TYPES = ['freemium-beta', 'premium', 'enterprise'];

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.page.set(Number(params.get('page') ?? 1));
      this.search.set(params.get('search') ?? '');
      this.filterBlocked.set(params.get('isBlocked') ?? '');
      this.filterAccountType.set(params.get('accountType') ?? '');
      this.filterVerified.set(params.get('verified') ?? '');
      this.selected.set(new Set());
      this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    this.api
      .listCompanies({
        page: this.page(),
        limit: 25,
        search: this.search() || undefined,
        isBlocked: this.filterBlocked() === 'true' ? true : this.filterBlocked() === 'false' ? false : undefined,
        accountType: this.filterAccountType() || undefined,
        verified: this.filterVerified() === 'true' ? true : this.filterVerified() === 'false' ? false : undefined,
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
      queryParams: { search: null, isBlocked: null, accountType: null, verified: null, page: 1 },
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
    if (!confirm(`Supprimer définitivement l'entreprise "${name}" ? Cette action est irréversible.`)) return;
    this.api.deleteCompany(id).subscribe({
      next: () => { this.deleteMsg.set('✓ Entreprise supprimée'); this.load(); },
      error: (e) => this.deleteMsg.set(e?.error?.message ?? '✗ Erreur'),
    });
  }

  bulkDelete(): void {
    const ids = [...this.selected()];
    if (!ids.length) return;
    if (!confirm(`Supprimer définitivement ${ids.length} entreprise(s) ? Irréversible.`)) return;
    this.api.bulkDeleteCompanies(ids).subscribe({
      next: (r) => { this.deleteMsg.set(`✓ ${r.deleted} entreprise(s) supprimée(s)`); this.selected.set(new Set()); this.load(); },
      error: (e) => this.deleteMsg.set(e?.error?.message ?? '✗ Erreur'),
    });
  }
}
