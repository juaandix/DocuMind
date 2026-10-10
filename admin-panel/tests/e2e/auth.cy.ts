describe('Auth flow', () => {
  it('redirects unauthenticated users to /login', () => {
    cy.visit('/')
    cy.url().should('include', '/login')
  })

  it('shows login form', () => {
    cy.visit('/login')
    cy.get('input[type=email]').should('exist')
    cy.get('input[type=password]').should('exist')
    cy.get('button[type=submit]').should('contain', 'Sign in')
  })

  it('shows error on invalid credentials', () => {
    cy.intercept('POST', '**/auth/token', { statusCode: 401, body: { detail: 'Invalid credentials' } })
    cy.visit('/login')
    cy.get('input[type=email]').type('bad@example.com')
    cy.get('input[type=password]').type('wrongpass')
    cy.get('button[type=submit]').click()
    cy.contains('Invalid credentials').should('be.visible')
  })

  it('logs in with form-encoded credentials and lands on the dashboard', () => {
    cy.intercept('POST', '**/auth/token', { body: { access_token: 'e2e-token', token_type: 'bearer' } }).as('login')
    cy.intercept('GET', '**/admin/platform/stats', { fixture: 'stats.json' })
    cy.intercept('GET', '**/admin/platform/stats/history', { fixture: 'stats-history.json' })

    cy.visit('/login')
    cy.get('input[type=email]').type('admin@documind.test')
    cy.get('input[type=password]').type('secret123')
    cy.get('button[type=submit]').click()

    cy.wait('@login').then(({ request }) => {
      expect(request.headers['content-type']).to.include('application/x-www-form-urlencoded')
      expect(request.body).to.include('username=admin%40documind.test')
      expect(request.body).to.include('grant_type=password')
    })
    cy.url().should('include', '/dashboard')
    cy.window().its('localStorage.admin_token').should('eq', 'e2e-token')
  })

  it('logs out and returns to /login when the API answers 401', () => {
    cy.loginAsAdmin()
    cy.intercept('GET', '**/admin/platform/stats', { statusCode: 401, body: { detail: 'Token expired' } })
    cy.intercept('GET', '**/admin/platform/stats/history', { statusCode: 401, body: { detail: 'Token expired' } })

    cy.visit('/dashboard')
    cy.url().should('include', '/login')
    cy.window().its('localStorage.admin_token').should('not.exist')
  })
})
