import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = 'contact@worku.tn';
  otp = '';
  step: 'email' | 'otp' = 'email';
  loading = signal(false);
  error = signal<string | null>(null);
  adminError = signal(false);

  constructor() {
    if (this.route.snapshot.queryParamMap.get('error') === 'admin_required') {
      this.adminError.set(true);
    }
  }

  sendOtp(): void {
    if (!this.email.trim()) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.initiateLogin(this.email.trim()).subscribe({
      next: () => {
        this.step = 'otp';
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Impossible d\'envoyer le code');
        this.loading.set(false);
      },
    });
  }

  verify(): void {
    if (!this.otp.trim()) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.verifyLogin(this.email.trim(), this.otp.trim()).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Code invalide');
        this.loading.set(false);
      },
    });
  }

  back(): void {
    this.step = 'email';
    this.otp = '';
    this.error.set(null);
  }
}
