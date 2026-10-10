// The backend is stubbed with cy.intercept in every spec, so these tests only
// need the Angular dev server running (npm start).

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      loginAsAdmin(): Chainable<void>
    }
  }
}

Cypress.Commands.add('loginAsAdmin', () => {
  window.localStorage.setItem('admin_token', 'e2e-fake-token')
})

export {}
