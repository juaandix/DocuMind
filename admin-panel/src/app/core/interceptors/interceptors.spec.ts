import { TestBed } from '@angular/core/testing'
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { AuthService } from '../services/auth.service'
import { authInterceptor } from './auth.interceptor'
import { errorInterceptor } from './error.interceptor'

describe('HTTP interceptors', () => {
  let http: HttpClient
  let httpMock: HttpTestingController
  let auth: jasmine.SpyObj<AuthService>

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['getToken', 'logout'])
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
      ],
    })
    http = TestBed.inject(HttpClient)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => httpMock.verify())

  it('adds Bearer token when logged in', () => {
    auth.getToken.and.returnValue('abc')
    http.get('/x').subscribe()
    const req = httpMock.expectOne('/x')
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc')
    req.flush({})
  })

  it('sends no Authorization header without token', () => {
    auth.getToken.and.returnValue(null)
    http.get('/x').subscribe()
    const req = httpMock.expectOne('/x')
    expect(req.request.headers.has('Authorization')).toBeFalse()
    req.flush({})
  })

  it('logs out on 401 and rethrows', () => {
    auth.getToken.and.returnValue('abc')
    let status = 0
    http.get('/x').subscribe({ error: (e) => (status = e.status) })
    httpMock.expectOne('/x').flush({}, { status: 401, statusText: 'Unauthorized' })
    expect(auth.logout).toHaveBeenCalled()
    expect(status).toBe(401)
  })

  it('does not log out on other errors', () => {
    auth.getToken.and.returnValue('abc')
    http.get('/x').subscribe({ error: () => undefined })
    httpMock.expectOne('/x').flush({}, { status: 500, statusText: 'Server Error' })
    expect(auth.logout).not.toHaveBeenCalled()
  })
})
