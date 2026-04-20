import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4">
      <h3 class="font-weight-bold mb-4">Quản lý người dùng</h3>
      <div class="card">
        <div class="card-body p-0">
          <table class="table table-hover mb-0">
            <thead class="bg-dark text-white">
              <tr><th>ID</th><th>Username</th><th>Email</th><th>Vai trò</th><th>Ngày tạo</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              @for (u of users(); track u.id) {
                <tr>
                  <td>{{ u.id }}</td>
                  <td>{{ u.username }}</td>
                  <td>{{ u.email }}</td>
                  <td>
                    <select class="form-control form-control-sm" [value]="u.role"
                            (change)="changeRole(u.id, $any($event.target).value)">
                      <option value="USER">USER</option>
                      <option value="MODERATOR">MODERATOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td>{{ u.createdAt | date:'dd/MM/yyyy' }}</td>
                  <td>
                    <button class="btn btn-sm btn-danger" (click)="delete(u.id)">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AdminUsersComponent implements OnInit {
  users = signal<any[]>([]);

  constructor(private adminService: AdminService) {}

  ngOnInit() { this.load(); }

  load() {
    this.adminService.getUsers().subscribe(u => this.users.set(u));
  }

  changeRole(id: number, role: string) {
    this.adminService.updateUserRole(id, role).subscribe();
  }

  delete(id: number) {
    if (confirm('Xóa người dùng này?')) {
      this.adminService.deleteUser(id).subscribe(() => this.load());
    }
  }
}
