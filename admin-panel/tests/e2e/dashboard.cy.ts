describe('Dashboard', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
    cy.intercept('GET', '**/admin/platform/stats', { fixture: 'stats.json' }).as('stats')
    cy.intercept('GET', '**/admin/platform/stats/history', { fixture: 'stats-history.json' }).as('history')
  })

  it('sends the bearer token and renders platform metrics', () => {
    cy.visit('/dashboard')
    cy.wait('@stats').its('request.headers.authorization').should('eq', 'Bearer e2e-fake-token')
    cy.wait('@history')

    cy.contains('h1', 'Platform Dashboard')
    cy.contains('.stat-card', 'Total Workspaces').should('contain', '12')
    cy.contains('.stat-card', 'Total Users').should('contain', '48')
    cy.contains('.stat-card', 'Jobs Failed Today').should('contain', '1')
    cy.contains('.stat-card', 'Storage Used').should('contain', '500 MB')
  })

  it('renders both charts', () => {
    cy.visit('/dashboard')
    cy.wait(['@stats', '@history'])
    cy.contains('Documents Processed — Last 7 Days')
    cy.contains('Workspace Status')
    cy.get('canvas').should('have.length', 2)
  })
})
