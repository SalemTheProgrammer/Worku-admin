import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CreditBalanceItem } from '../../core/models/admin.models';
import { AdminApiService } from '../../core/services/admin-api.service';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-credits-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
  templateUrl: './credits-list.component.html',
})
export class CreditsListComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  items = signal<CreditBalanceItem[]>([]);
  loading = signal(true);
  page = signal(1);
  total = signal(0);
  totalPages = signal(1);
  search = signal('');

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.page.set(Number(params.get('page') ?? 1));
      this.search.set(params.get('search') ?? '');
      this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    this.api
      .listCreditBalances({
        page: this.page(),
        limit: 25,
        search: this.search() || undefined,
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

  applySearch(value: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: value || null, page: 1 },
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
}
