import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="pagination" *ngIf="totalPages > 1" aria-label="Pagination">
      <button type="button" class="page-btn" [disabled]="page <= 1" (click)="go(page - 1)">
        Précédent
      </button>
      <span class="page-info">Page {{ page }} / {{ totalPages }} · {{ total }} éléments</span>
      <button type="button" class="page-btn" [disabled]="page >= totalPages" (click)="go(page + 1)">
        Suivant
      </button>
    </nav>
  `,
  styles: [
    `
      .pagination {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 16px 0 0;
      }
      .page-info {
        font-size: 13px;
        color: var(--fg-3);
      }
      .page-btn {
        border: 1px solid var(--hairline);
        background: var(--paper);
        color: var(--fg-2);
        border-radius: 8px;
        padding: 8px 14px;
        font-size: 13px;
        cursor: pointer;
      }
      .page-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      .page-btn:not(:disabled):hover {
        border-color: var(--brand);
        color: var(--brand);
      }
    `,
  ],
})
export class PaginationComponent {
  @Input() page = 1;
  @Input() totalPages = 1;
  @Input() total = 0;
  @Output() pageChange = new EventEmitter<number>();

  go(next: number): void {
    if (next >= 1 && next <= this.totalPages) {
      this.pageChange.emit(next);
    }
  }
}
