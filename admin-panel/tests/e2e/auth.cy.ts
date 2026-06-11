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
})
