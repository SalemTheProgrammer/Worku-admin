import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="admin-shell">
      <app-sidebar (logout)="onLogout()" />
      <main class="admin-main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      .admin-shell {
        min-height: 100vh;
        background: var(--bg);
      }
      .admin-main {
        margin-left: 220px;
        min-height: 100vh;
      }
    `,
  ],
})
export class AdminLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  onLogout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
