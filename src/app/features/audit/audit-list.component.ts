import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuditLogItem } from '../../core/models/admin.models';
import { AdminApiService } from '../../core/services/admin-api.service';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-audit-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './audit-list.component.html',
})
export class AuditListComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  items = signal<AuditLogItem[]>([]);
  loading = signal(true);
  page = signal(1);
  total = signal(0);
  totalPages = signal(1);
  action = signal('');
  adminEmail = signal('');
  targetId = signal('');

  readonly actions = [
    'company.block',
    'company.unblock',
    'company.verify',
    'company.unverify',
    'credits.grant',
    'credits.deduct',
    'provider.create',
    'provider.update',
    'provider.delete',
    'provider.test',
    'provider.reorder',
  ];

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.page.set(Number(params.get('page') ?? 1));
      this.action.set(params.get('action') ?? '');
      this.adminEmail.set(params.get('adminEmail') ?? '');
      this.targetId.set(params.get('targetId') ?? '');
      this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    this.api
      .listAuditLogs({
        page: this.page(),
        limit: 30,
        action: this.action() || undefined,
        adminEmail: this.adminEmail() || undefined,
        targetId: this.targetId() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.items.set(
            res.items.map((item: AuditLogItem & { _id?: string }) => ({
              ...item,
              id: item.id ?? item._id ?? '',
            })),
          );
          this.total.set(res.total);
          this.totalPages.set(res.totalPages);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  applyFilters(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: 1,
        action: this.action() || null,
        adminEmail: this.adminEmail() || null,
        targetId: this.targetId() || null,
      },
      queryParamsHandling: 'merge',
    });
  }

  resetFilters(): void {
    this.action.set('');
    this.adminEmail.set('');
    this.targetId.set('');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: 1, action: null, adminEmail: null, targetId: null },
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
