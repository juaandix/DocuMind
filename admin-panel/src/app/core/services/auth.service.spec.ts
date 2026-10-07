import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { Router } from '@angular/router'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  let service: AuthService
  let httpMock: HttpTestingController
  let router: jasmine.SpyObj<Router>

  beforeEach(() => {
    localStorage.clear()
    router = jasmine.createSpyObj<Router>('Router', ['navigate'])
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: Router, useValue: router }],
    })
    service = TestBed.inject(AuthService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => httpMock.verify())

  it('is not logged in without a token', () => {
    expect(service.isLoggedIn()).toBeFalse()
  })

  it('login posts form-encoded credentials to /auth/token and stores the token', () => {
    service.login('admin@example.com', 'secret').subscribe()

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/v1/auth/token'))
    expect(req.request.method).toBe('POST')
    expect(req.request.headers.get('Content-Type')).toBe('application/x-www-form-urlencoded')
    const body = new URLSearchParams(req.request.body)
    expect(body.get('username')).toBe('admin@example.com')
    expect(body.get('password')).toBe('secret')
    req.flush({ access_token: 'tok', token_type: 'bearer' })

    expect(service.getToken()).toBe('tok')
    expect(service.isLoggedIn()).toBeTrue()
  })

  it('logout clears the token and redirects to /login', () => {
    localStorage.setItem('admin_token', 'tok')
    service.logout()
    expect(service.isLoggedIn()).toBeFalse()
    expect(router.navigate).toHaveBeenCalledWith(['/login'])
  })
})
