import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthTokens } from '../models/admin.models';

const ACCESS_KEY = 'worku.admin.accessToken';
const REFRESH_KEY = 'worku.admin.refreshToken';
const EMAIL_KEY = 'worku.admin.email';

interface VerifyResponse {
  message?: string;
  data?: {
    tokens: AuthTokens;
    entreprise?: { nomEntreprise: string; email: string };
  };
  tokens?: AuthTokens;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly email = signal<string | null>(this.readEmail());
  readonly isAuthenticated = signal<boolean>(!!this.getAccessToken());

  constructor(private readonly http: HttpClient) {}

  initiateLogin(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.apiUrl}/auth/company/login/initiate`,
      { email },
    );
  }

  verifyLogin(email: string, otp: string): Observable<AuthTokens> {
    return this.http
      .post<VerifyResponse>(`${environment.apiUrl}/auth/company/login/verify`, {
        email,
        otp,
      })
      .pipe(
        map((res) => {
          const tokens = res.data?.tokens ?? res.tokens;
          if (!tokens?.accessToken) {
            throw new Error('Token manquant dans la réponse');
          }
          return tokens;
        }),
        tap((tokens) => this.storeSession(email, tokens)),
      );
  }

  refreshToken(): Observable<AuthTokens> {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) {
      throw new Error('No refresh token');
    }
    return this.http
      .post<VerifyResponse>(`${environment.apiUrl}/auth/company/refresh-token`, {
        refreshToken,
      })
      .pipe(
        map((res) => {
          const tokens = res.data?.tokens ?? res.tokens;
          if (!tokens?.accessToken) {
            throw new Error('Token manquant');
          }
          return tokens;
        }),
        tap((tokens) => {
          const email = this.readEmail() ?? '';
          this.storeSession(email, tokens);
        }),
      );
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  logout(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(EMAIL_KEY);
    this.email.set(null);
    this.isAuthenticated.set(false);
  }

  private storeSession(email: string, tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    localStorage.setItem(EMAIL_KEY, email);
    this.email.set(email);
    this.isAuthenticated.set(true);
  }

  private readEmail(): string | null {
    return localStorage.getItem(EMAIL_KEY);
  }
}
