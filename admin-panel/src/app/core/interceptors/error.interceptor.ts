import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http'
import { inject } from '@angular/core'
import { catchError, throwError } from 'rxjs'
import { AuthService } from '../services/auth.service'

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  // inject() must run in the injection context, not inside the async catchError callback
  const auth = inject(AuthService)
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) auth.logout()
      return throwError(() => err)
    })
  )
}
