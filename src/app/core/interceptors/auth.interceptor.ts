import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const isAuthFlow =
    req.url.includes('/auth/company/login/') ||
    req.url.includes('/auth/company/register');

  let request = req;
  const token = auth.getAccessToken();
  if (token && !isAuthFlow) {
    request = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !isAuthFlow
      ) {
        auth.logout();
        router.navigate(['/login']);
      }
      if (
        error instanceof HttpErrorResponse &&
        error.status === 403 &&
        req.url.includes('/admin/')
      ) {
        auth.logout();
        router.navigate(['/login'], {
          queryParams: { error: 'admin_required' },
        });
      }
      return throwError(() => error);
    }),
  );
};
