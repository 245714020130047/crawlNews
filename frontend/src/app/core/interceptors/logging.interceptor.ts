import { HttpInterceptorFn } from '@angular/common/http';
import { tap, finalize } from 'rxjs/operators';

/**
 * HTTP request/response logging interceptor.
 * Logs request start, response status, and duration.
 */
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const startTime = Date.now();
  const method = req.method;
  const url = req.urlWithParams;

  console.debug(`[HTTP] → ${method} ${url}`);

  return next(req).pipe(
    tap({
      next: (event) => {
        if ((event as any).status !== undefined) {
          const status = (event as any).status;
          const duration = Date.now() - startTime;
          if (status >= 400) {
            console.warn(`[HTTP] ← ${method} ${url} | ${status} | ${duration}ms`);
          } else {
            console.debug(`[HTTP] ← ${method} ${url} | ${status} | ${duration}ms`);
          }
        }
      },
      error: (err) => {
        const duration = Date.now() - startTime;
        console.error(`[HTTP] ✗ ${method} ${url} | ${err.status} | ${duration}ms`, err.message);
      }
    }),
    finalize(() => {/* cleanup if needed */})
  );
};
