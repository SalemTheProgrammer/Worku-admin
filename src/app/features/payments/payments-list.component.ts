import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PaymentSummary, PurchaseItem } from '../../core/models/admin.models';
import { AdminApiService } from '../../core/services/admin-api.service';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-payments-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
  templateUrl: './payments-list.component.html',
})
export class PaymentsListComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  items = signal<PurchaseItem[]>([]);
  summary = signal<PaymentSummary | null>(null);
  loading = signal(true);
  page = signal(1);
  total = signal(0);
  totalPages = signal(1);
  filterStatus = signal('');

  ngOnInit(): void {
    this.api.getPaymentsSummary().subscribe({ next: (s) => this.summary.set(s) });
    this.route.queryParamMap.subscribe((params) => {
      this.page.set(Number(params.get('page') ?? 1));
      this.filterStatus.set(params.get('status') ?? '');
      this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    this.api
      .listPayments({
        page: this.page(),
        limit: 25,
        status: this.filterStatus() || undefined,
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

  applyFilter(status: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status: status || null, page: 1 },
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

  statusClass(status: string): string {
    switch (status) {
      case 'completed': return 'badge badge-good';
      case 'pending':   return 'badge badge-warn';
      case 'failed':    return 'badge badge-danger';
      case 'expired':   return 'badge badge-muted';
      default:          return 'badge badge-muted';
    }
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'Payé';
      case 'pending':   return 'En attente';
      case 'failed':    return 'Échoué';
      case 'expired':   return 'Expiré';
      default:          return status;
    }
  }
}
