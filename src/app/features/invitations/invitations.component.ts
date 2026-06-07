import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  AdminApiService,
  CreateInviteResult,
  InviteListItem,
} from '../../core/services/admin-api.service';

@Component({
  selector: 'app-invitations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="inv-page">
      <header class="inv-header">
        <h1>Invitations</h1>
        <p>Créez un accès direct au tableau de bord pour un utilisateur (lien valable 7 jours).</p>
      </header>

      <!-- Create form -->
      <section class="inv-card">
        <h2>Nouvelle invitation</h2>
        <div class="inv-form">
          <div class="inv-field">
            <label>Prénom</label>
            <input type="text" [(ngModel)]="firstName" placeholder="Prénom" />
          </div>
          <div class="inv-field">
            <label>Nom</label>
            <input type="text" [(ngModel)]="lastName" placeholder="Nom" />
          </div>
          <div class="inv-field">
            <label>Entreprise <span class="inv-opt">(optionnel)</span></label>
            <input type="text" [(ngModel)]="companyName" placeholder="Freelance si vide" />
          </div>
          <button
            class="inv-btn inv-btn--primary"
            [disabled]="creating() || !canCreate()"
            (click)="create()">
            {{ creating() ? 'Création…' : 'Générer le lien' }}
          </button>
        </div>
        <p class="inv-error" *ngIf="createError()">{{ createError() }}</p>

        <!-- Generated link -->
        <div class="inv-result" *ngIf="lastCreated() as r">
          <div class="inv-result-row">
            <span class="inv-tag">{{ r.company.email }}</span>
            <span class="inv-muted">expire le {{ r.magicLinkExpiresAt | date: 'short' }}</span>
          </div>
          <div class="inv-link-box">
            <input type="text" readonly [value]="r.magicLink" #linkInput />
            <button class="inv-btn" (click)="copy(r.magicLink)">
              {{ copiedLink() === r.magicLink ? 'Copié ✓' : 'Copier' }}
            </button>
          </div>
        </div>
      </section>

      <!-- List -->
      <section class="inv-card">
        <div class="inv-list-head">
          <h2>Comptes invités</h2>
          <button class="inv-btn" (click)="load()">Actualiser</button>
        </div>

        <p *ngIf="loading()" class="inv-muted">Chargement…</p>
        <p *ngIf="!loading() && invites().length === 0" class="inv-muted">
          Aucune invitation pour le moment.
        </p>

        <table class="inv-table" *ngIf="!loading() && invites().length > 0">
          <thead>
            <tr>
              <th>Entreprise</th>
              <th>Email</th>
              <th>Lien</th>
              <th>Email changé</th>
              <th>Dernière connexion</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let inv of invites()">
              <td>
                <a [routerLink]="['/companies', inv.id]" class="inv-company-link">
                  {{ inv.nomEntreprise }}
                </a>
                <div class="inv-muted inv-small" *ngIf="inv.firstName || inv.lastName">
                  {{ inv.firstName }} {{ inv.lastName }}
                </div>
              </td>
              <td>{{ inv.email }}</td>
              <td>
                <span class="inv-badge" [class.inv-badge--ok]="inv.linkActive" [class.inv-badge--off]="!inv.linkActive">
                  {{ inv.linkActive ? 'Actif' : 'Expiré' }}
                </span>
              </td>
              <td>
                <span class="inv-badge" [class.inv-badge--ok]="inv.emailChanged" [class.inv-badge--off]="!inv.emailChanged">
                  {{ inv.emailChanged ? 'Oui' : 'Non' }}
                </span>
              </td>
              <td>{{ inv.lastLoginAt ? (inv.lastLoginAt | date: 'short') : '—' }}</td>
              <td class="inv-actions">
                <button class="inv-btn inv-btn--sm" (click)="regenerate(inv)">Nouveau lien</button>
                <button class="inv-btn inv-btn--sm" (click)="toggleEmailEdit(inv.id)">Changer email</button>
                <button
                  class="inv-btn inv-btn--sm inv-btn--danger"
                  [disabled]="deletingId() === inv.id"
                  (click)="remove(inv)">
                  {{ deletingId() === inv.id ? '…' : 'Supprimer' }}
                </button>
              </td>
            </tr>
            <tr *ngFor="let inv of invites()">
              <td colspan="6" class="inv-edit-row" *ngIf="editingId() === inv.id">
                <input type="email" [(ngModel)]="newEmail" placeholder="nouvel.email@domaine.com" />
                <button class="inv-btn inv-btn--primary inv-btn--sm" [disabled]="savingEmail()" (click)="saveEmail(inv)">
                  {{ savingEmail() ? '…' : 'Enregistrer' }}
                </button>
                <button class="inv-btn inv-btn--sm" (click)="editingId.set(null)">Annuler</button>
                <span class="inv-error" *ngIf="emailError()">{{ emailError() }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  `,
  styles: [
    `
      .inv-page { padding: 24px; max-width: 1100px; }
      .inv-header h1 { margin: 0 0 4px; font-size: 22px; font-weight: 700; }
      .inv-header p { margin: 0 0 20px; color: #64748b; font-size: 14px; }
      .inv-card {
        background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
        padding: 20px; margin-bottom: 20px;
      }
      .inv-card h2 { margin: 0 0 14px; font-size: 16px; font-weight: 600; }
      .inv-form { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
      .inv-field { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 160px; }
      .inv-field label { font-size: 12px; font-weight: 600; color: #475569; }
      .inv-opt { color: #94a3b8; font-weight: 400; }
      .inv-field input, .inv-link-box input, .inv-edit-row input {
        padding: 9px 11px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px;
      }
      .inv-btn {
        padding: 9px 14px; border: 1px solid #cbd5e1; background: #f8fafc;
        border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; color: #334155;
      }
      .inv-btn:disabled { opacity: 0.6; cursor: wait; }
      .inv-btn--primary { background: #2563eb; color: #fff; border-color: #2563eb; }
      .inv-btn--danger { color: #dc2626; border-color: #fecaca; background: #fef2f2; }
      .inv-btn--sm { padding: 6px 10px; font-size: 12px; }
      .inv-result { margin-top: 16px; padding-top: 16px; border-top: 1px dashed #e2e8f0; }
      .inv-result-row { display: flex; gap: 12px; align-items: center; margin-bottom: 8px; }
      .inv-tag { font-weight: 600; color: #0f172a; }
      .inv-muted { color: #94a3b8; font-size: 13px; }
      .inv-small { font-size: 11px; }
      .inv-link-box { display: flex; gap: 8px; }
      .inv-link-box input { flex: 1; background: #f1f5f9; }
      .inv-list-head { display: flex; justify-content: space-between; align-items: center; }
      .inv-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      .inv-table th, .inv-table td { text-align: left; padding: 10px 8px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
      .inv-table th { color: #64748b; font-weight: 600; }
      .inv-company-link { color: #2563eb; text-decoration: none; font-weight: 600; }
      .inv-badge { padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
      .inv-badge--ok { background: #dcfce7; color: #15803d; }
      .inv-badge--off { background: #f1f5f9; color: #64748b; }
      .inv-actions { display: flex; gap: 6px; }
      .inv-edit-row { background: #f8fafc; }
      .inv-edit-row input { margin-right: 8px; min-width: 240px; }
      .inv-error { color: #dc2626; font-size: 13px; margin-top: 8px; }
    `,
  ],
})
export class InvitationsComponent implements OnInit {
  private readonly api = inject(AdminApiService);

  firstName = '';
  lastName = '';
  companyName = '';
  newEmail = '';

  readonly creating = signal(false);
  readonly createError = signal('');
  readonly lastCreated = signal<CreateInviteResult | null>(null);
  readonly copiedLink = signal<string | null>(null);

  readonly invites = signal<InviteListItem[]>([]);
  readonly loading = signal(true);

  readonly editingId = signal<string | null>(null);
  readonly savingEmail = signal(false);
  readonly emailError = signal('');
  readonly deletingId = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  canCreate(): boolean {
    // Company is optional (freelancers); only name fields are required.
    return !!(this.firstName.trim() && this.lastName.trim());
  }

  create(): void {
    if (this.creating() || !this.canCreate()) return;
    this.creating.set(true);
    this.createError.set('');
    this.api
      .createInvite({
        firstName: this.firstName.trim(),
        lastName: this.lastName.trim(),
        companyName: this.companyName.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.creating.set(false);
          this.lastCreated.set(res);
          this.firstName = this.lastName = this.companyName = '';
          this.load();
        },
        error: (err) => {
          this.creating.set(false);
          this.createError.set(err?.error?.message || 'Échec de la création.');
        },
      });
  }

  load(): void {
    this.loading.set(true);
    this.api.listInvites().subscribe({
      next: (items) => {
        this.invites.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.invites.set([]);
        this.loading.set(false);
      },
    });
  }

  regenerate(inv: InviteListItem): void {
    this.api.regenerateInviteLink(inv.id).subscribe({
      next: (res) => {
        this.lastCreated.set({
          company: {
            id: inv.id,
            email: inv.email,
            nomEntreprise: inv.nomEntreprise,
            firstName: inv.firstName,
            lastName: inv.lastName,
          },
          magicLink: res.magicLink,
          magicLinkExpiresAt: res.magicLinkExpiresAt,
        });
        this.load();
      },
    });
  }

  toggleEmailEdit(id: string): void {
    this.emailError.set('');
    this.newEmail = '';
    this.editingId.set(this.editingId() === id ? null : id);
  }

  saveEmail(inv: InviteListItem): void {
    const email = this.newEmail.trim();
    if (!email) return;
    this.savingEmail.set(true);
    this.emailError.set('');
    this.api.changeInviteEmail(inv.id, email).subscribe({
      next: () => {
        this.savingEmail.set(false);
        this.editingId.set(null);
        this.load();
      },
      error: (err) => {
        this.savingEmail.set(false);
        this.emailError.set(err?.error?.message || 'Échec du changement d’email.');
      },
    });
  }

  remove(inv: InviteListItem): void {
    if (this.deletingId()) return;
    const ok = confirm(
      `Supprimer définitivement le compte « ${inv.nomEntreprise} » (${inv.email}) ?`,
    );
    if (!ok) return;

    this.deletingId.set(inv.id);
    this.api.deleteInvite(inv.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        if (this.lastCreated()?.company.id === inv.id) {
          this.lastCreated.set(null);
        }
        this.load();
      },
      error: () => {
        this.deletingId.set(null);
      },
    });
  }

  copy(link: string): void {
    navigator.clipboard?.writeText(link).then(() => {
      this.copiedLink.set(link);
      setTimeout(() => this.copiedLink.set(null), 2000);
    });
  }
}
