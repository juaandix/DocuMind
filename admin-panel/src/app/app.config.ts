import { ApplicationConfig } from '@angular/core'
import { provideRouter, withRouterConfig } from '@angular/router'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { provideStore } from '@ngrx/store'
import { provideEffects } from '@ngrx/effects'
import { provideStoreDevtools } from '@ngrx/store-devtools'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'
import { routes } from './app.routes'
import { reducers, effects } from './store'
import { authInterceptor } from './core/interceptors/auth.interceptor'
import { errorInterceptor } from './core/interceptors/error.interceptor'
import { environment } from '../environments/environment'

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withRouterConfig({ paramsInheritanceStrategy: 'always' })),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideStore(reducers),
    provideEffects(effects),
    provideStoreDevtools({ maxAge: 25, logOnly: environment.production }),
    provideAnimationsAsync(),
  ],
}
