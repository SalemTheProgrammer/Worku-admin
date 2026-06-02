import { CommonModule, JsonPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SessionDetail, SessionFilters, SessionPrompt } from '../../core/models/admin.models';
import { AdminApiService } from '../../core/services/admin-api.service';

@Component({
  selector: 'app-session-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, JsonPipe],
  templateUrl: './session-detail.component.html',
})
export class SessionDetailComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  readonly route = inject(ActivatedRoute);

  session = signal<SessionDetail | null>(null);
  prompt = signal<SessionPrompt | null>(null);
  filters = signal<SessionFilters | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getSession(id).subscribe({
      next: (s) => {
        this.session.set(s);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.api.getSessionPrompt(id).subscribe((p) => this.prompt.set(p));
    this.api.getSessionFilters(id).subscribe((f) => this.filters.set(f));
  }

  searchFilters(): Record<string, unknown> | null {
    return this.filters()?.searchFilters ?? this.session()?.searchFilters ?? null;
  }
}
