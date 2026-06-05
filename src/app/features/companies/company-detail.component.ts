import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CompanyCreditSummary, CompanyDetail } from '../../core/models/admin.models';
import { AdminApiService } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-company-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './company-detail.component.html',
})
export class CompanyDetailComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly route = inject(ActivatedRoute);

  company = signal<CompanyDetail | null>(null);
  credits = signal<CompanyCreditSummary | null>(null);
  loading = signal(true);
  actionLoading = signal(false);
  message = signal<string | null>(null);
  error = signal<string | null>(null);
  blockReason = '';
  creditAmount = 50;
  creditReason = 'Ajustement admin';

  // Plan switcher
  selectedPlan = '';
  planExpiresAt = '';

  readonly PLANS: {
    value: string;
    label: string;
    credits: number;
    price: string;
    seats: number;
    accountType: string;
    badge?: string;
  }[] = [
    { value: 'discovery', label: 'Essai Gratuit',  credits: 30,   price: 'Gratuit',      seats: 1, accountType: 'freemium-beta' },
    { value: 'recruiter', label: 'Starter',         credits: 220,  price: '189 TND/mois', seats: 1, accountType: 'premium' },
    { value: 'agency',    label: 'Pro',             credits: 600,  price: '399 TND/mois', seats: 1, accountType: 'enterprise', badge: 'Recommandé' },
    { value: 'team',      label: 'Team',            credits: 1500, price: '899 TND/mois', seats: 3, accountType: 'enterprise' },
  ];

  get selectedPlanMeta() {
    return this.PLANS.find(p => p.value === this.selectedPlan) ?? null;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getCompany(id).subscribe({
      next: (company) => {
        this.company.set(this.normalizeCompany(company));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.loadCredits(id);
  }

  get id(): string {
    return this.company()?.id ?? this.company()?._id ?? this.route.snapshot.paramMap.get('id') ?? '';
  }

  block(): void {
    if (!this.blockReason.trim()) {
      this.error.set('Une raison de blocage est requise.');
      return;
    }
    this.actionLoading.set(true);
    this.error.set(null);
    this.api.blockCompany(this.id, this.blockReason.trim()).subscribe({
      next: () => this.reload('Entreprise bloquee.'),
      error: (err) => this.fail(err),
    });
  }

  unblock(): void {
    this.actionLoading.set(true);
    this.error.set(null);
    this.api.unblockCompany(this.id).subscribe({
      next: () => this.reload('Entreprise debloquee.'),
      error: (err) => this.fail(err),
    });
  }

  toggleVerified(): void {
    const current = !!this.company()?.isAdminVerified;
    this.actionLoading.set(true);
    this.error.set(null);
    this.api.setCompanyVerified(this.id, !current).subscribe({
      next: () => this.reload(current ? 'Badge admin retire.' : 'Entreprise verifiee.'),
      error: (err) => this.fail(err),
    });
  }

  grantCredits(): void {
    this.adjustCredits('grant');
  }

  deductCredits(): void {
    this.adjustCredits('deduct');
  }

  private adjustCredits(mode: 'grant' | 'deduct'): void {
    if (!Number.isFinite(this.creditAmount) || this.creditAmount <= 0 || !this.creditReason.trim()) {
      this.error.set('Saisissez un montant positif et une raison.');
      return;
    }

    this.actionLoading.set(true);
    this.error.set(null);
    const request =
      mode === 'grant'
        ? this.api.grantCredits(this.id, this.creditAmount, this.creditReason.trim())
        : this.api.deductCredits(this.id, this.creditAmount, this.creditReason.trim());

    request.subscribe({
      next: (result) => {
        const sign = mode === 'grant' ? '+' : '-';
        this.message.set(`${sign}${this.creditAmount} credits - solde ${result.balance}`);
        this.loadCredits(this.id);
        this.actionLoading.set(false);
      },
      error: (err) => this.fail(err),
    });
  }

  changePlan(): void {
    if (!this.selectedPlan) {
      this.error.set('Sélectionnez un plan.');
      return;
    }
    this.actionLoading.set(true);
    this.error.set(null);
    const expiresAt = this.planExpiresAt || null;
    this.api.changeCompanyPlan(this.id, this.selectedPlan, expiresAt).subscribe({
      next: (result) => {
        this.loadCredits(this.id);
        this.message.set(`Plan changé → ${result.plan} (${result.accountType})`);
        this.reload('Plan mis à jour.');
      },
      error: (err) => this.fail(err),
    });
  }

  private loadCredits(id: string): void {
    this.api.getCompanyCredits(id).subscribe({
      next: (credits) => this.credits.set(credits),
    });
  }

  private reload(msg: string): void {
    this.message.set(msg);
    this.error.set(null);
    this.api.getCompany(this.id).subscribe({
      next: (company) => {
        this.company.set(this.normalizeCompany(company));
        this.actionLoading.set(false);
      },
      error: (err) => this.fail(err),
    });
  }

  private normalizeCompany(company: CompanyDetail): CompanyDetail {
    return { ...company, id: company.id ?? company._id ?? this.id };
  }

  private fail(err: { error?: { message?: string } }): void {
    this.error.set(err.error?.message ?? 'Action impossible.');
    this.actionLoading.set(false);
  }
}
