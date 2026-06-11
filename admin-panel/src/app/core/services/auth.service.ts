import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Router } from '@angular/router'
import { tap } from 'rxjs/operators'
import { environment } from '../../../environments/environment'

interface LoginResponse {
  access_token: string
  token_type: string
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'admin_token'

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    const body = new URLSearchParams({ username: email, password, grant_type: 'password' })
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/api/v1/auth/token`, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .pipe(tap((res) => localStorage.setItem(this.TOKEN_KEY, res.access_token)))
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY)
    this.router.navigate(['/login'])
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY)
  }

  isLoggedIn(): boolean {
    return !!this.getToken()
  }
}
