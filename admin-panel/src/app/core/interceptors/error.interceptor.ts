import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http'
import { inject } from '@angular/core'
import { Router } from '@angular/router'
import { catchError, throwError } from 'rxjs'
import { AuthService } from '../services/auth.service'

export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) inject(AuthService).logout()
      return throwError(() => err)
    })
  )
