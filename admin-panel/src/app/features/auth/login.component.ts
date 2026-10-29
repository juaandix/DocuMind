import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatButtonModule } from '@angular/material/button'
import { AuthService } from '../../core/services/auth.service'

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <div class="login">
      <header class="bar">
        <span class="mark" aria-hidden="true">D<span class="notch"></span></span>
        <span class="wordmark">DocuMind</span>
        <span class="scope">Platform admin</span>
      </header>
      <main class="center">
        <section class="card">
          <h1 class="title">Sign in to the admin console</h1>
          <p class="sub">Platform administrators only. Workspace members use the DocuMind app.</p>
          <form (ngSubmit)="submit()" #loginForm="ngForm">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" [(ngModel)]="email" name="email" autocomplete="email" required />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput type="password" [(ngModel)]="password" name="password" autocomplete="current-password" required />
            </mat-form-field>
            <p *ngIf="error" class="error-msg" role="alert">{{ error }}</p>
            <button mat-flat-button color="primary" type="submit" [disabled]="loading" class="full-width submit">
              {{ loading ? 'Signing in…' : 'Sign in' }}
            </button>
          </form>
        </section>
      </main>
    </div>
  `,
  styles: [`
    .login { min-height: 100dvh; display: flex; flex-direction: column; background: var(--dm-ground); }
    .bar { display: flex; align-items: center; gap: 10px; height: 56px; padding: 0 24px; background: var(--dm-rail); }
    .mark { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 5px;
      background: var(--dm-alert); color: var(--dm-on-alert); font: 700 20px/1 var(--font-display); }
    .notch { position: absolute; top: 50%; right: -3px; width: 6px; height: 6px; border-radius: 50%; background: var(--dm-rail); transform: translateY(-50%); }
    .wordmark { font: 700 20px/1 var(--font-display); letter-spacing: 0.06em; text-transform: uppercase; color: var(--dm-on-ink); }
    .scope { margin-left: 6px; font: 600 11px var(--font-mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--dm-rail-ink-2); }
    .center { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 16px; }
    .card { width: 100%; max-width: 400px; background: var(--dm-surface); border-radius: 6px; box-shadow: var(--dm-shadow); padding: 28px; }
    .title { margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.015em; color: var(--dm-ink); }
    .sub { margin: 6px 0 24px; font-size: 14px; color: var(--dm-ink-2); }
    .full-width { width: 100%; display: block; }
    .submit { min-height: 44px; margin-top: 4px; }
    .error-msg { margin: 0 0 12px; padding: 10px 12px; border: 1px solid var(--dm-danger); border-radius: 5px; background: var(--dm-danger-soft); color: var(--dm-danger); font-size: 14px; }
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
