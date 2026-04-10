import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Prepends API base URL to relative /api paths.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('/api')) {
    const apiReq = req.clone({
      url: environment.apiBaseUrl + req.url.replace('/api', '')
    });
    return next(apiReq);
  }
  return next(req);
};
