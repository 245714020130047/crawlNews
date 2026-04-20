import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-schedulers',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4">
      <h3 class="font-weight-bold mb-4">Quản lý lịch trình</h3>
      <div class="row">
        @for (s of schedulers(); track s.id) {
          <div class="col-md-6 mb-3">
            <div class="card">
              <div class="card-header bg-dark text-white d-flex justify-content-between">
                <h5 class="m-0">{{ s.name }}</h5>
                <span class="badge" [class.badge-success]="s.enabled" [class.badge-secondary]="!s.enabled">
                  {{ s.enabled ? 'Bật' : 'Tắt' }}
                </span>
              </div>
              <div class="card-body">
                <p><strong>Cron:</strong> <code>{{ s.cronExpression }}</code></p>
                <p class="text-muted small">{{ s.description }}</p>
                <button class="btn" [class.btn-warning]="s.enabled" [class.btn-success]="!s.enabled"
                        (click)="toggle(s.id, !s.enabled)">
                  {{ s.enabled ? 'Tắt' : 'Bật' }}
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class AdminSchedulersComponent implements OnInit {
  schedulers = signal<any[]>([]);

  constructor(private adminService: AdminService) {}

  ngOnInit() { this.load(); }

  load() {
    this.adminService.getSchedulers().subscribe(s => this.schedulers.set(s));
  }

  toggle(id: number, enabled: boolean) {
    this.adminService.toggleScheduler(id, enabled).subscribe(() => this.load());
  }
}
