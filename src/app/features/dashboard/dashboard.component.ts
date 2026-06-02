import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProviderStats } from '../../core/models/admin.models';
import { AdminApiService } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(AdminApiService);

  loading = signal(true);
  promptVersion = signal('');
  providerOrder = signal<string[]>([]);
  providerStats = signal<ProviderStats[]>([]);
  companiesTotal = signal(0);
  blockedCompanies = signal(0);
  sessionsTotal = signal(0);
  creditsTotal = signal(0);

  ngOnInit(): void {
    this.api.getFilterPromptVersion().subscribe({
      next: (r) => this.promptVersion.set(r.version),
    });
    this.api.getProviderOrder().subscribe({
      next: (r) => this.providerOrder.set(r.order),
    });
    this.api.getProviderStats().subscribe({
      next: (stats) => this.providerStats.set(stats),
    });
    this.api.listCompanies({ page: 1, limit: 1 }).subscribe({
      next: (r) => this.companiesTotal.set(r.total),
    });
    this.api.listCompanies({ page: 1, limit: 1, isBlocked: true }).subscribe({
      next: (r) => this.blockedCompanies.set(r.total),
    });
    this.api.listSessions({ page: 1, limit: 1 }).subscribe({
      next: (r) => {
        this.sessionsTotal.set(r.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.api.listCreditBalances({ page: 1, limit: 100 }).subscribe({
      next: (r) => {
        const sum = r.items.reduce((acc, i) => acc + (i.creditsAvailable ?? 0), 0);
        this.creditsTotal.set(Math.round(sum * 100) / 100);
      },
    });
  }
}
