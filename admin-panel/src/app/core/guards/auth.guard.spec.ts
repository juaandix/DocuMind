import { TestBed } from '@angular/core/testing'
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router'
import { AuthService } from '../services/auth.service'
import { authGuard } from './auth.guard'

describe('authGuard', () => {
  let auth: jasmine.SpyObj<AuthService>

  const run = () =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    )

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['isLoggedIn'])
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    })
  })

  it('allows activation when logged in', () => {
    auth.isLoggedIn.and.returnValue(true)
    expect(run()).toBeTrue()
  })

  it('redirects to /login when logged out', () => {
    auth.isLoggedIn.and.returnValue(false)
    const result = run() as UrlTree
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/login')
  })
})
