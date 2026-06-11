import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { MatCardModule } from '@angular/material/card'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatButtonModule } from '@angular/material/button'
import { AuthService } from '../../core/services/auth.service'

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>DocuMind Admin</mat-card-title>
          <mat-card-subtitle>Platform Administration Panel</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form (ngSubmit)="submit()" #loginForm="ngForm">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" [(ngModel)]="email" name="email" required />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput type="password" [(ngModel)]="password" name="password" required />
            </mat-form-field>
            <p *ngIf="error" class="error-msg">{{ error }}</p>
            <button mat-raised-button color="primary" type="submit" [disabled]="loading" class="full-width">
              {{ loading ? 'Signing in…' : 'Sign in' }}
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f4f6; }
    .login-card { width: 100%; max-width: 400px; padding: 16px; }
    .full-width { width: 100%; margin-bottom: 16px; display: block; }
    .error-msg { color: #ef4444; font-size: 13px; margin-bottom: 12px; }
  `],
})
export class LoginComponent {
  email = ''
  password = ''
  error = ''
  loading = false

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    this.error = ''
    this.loading = true
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error = err.error?.detail ?? 'Login failed'
        this.loading = false
      },
    })
  }
}
