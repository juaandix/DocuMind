describe('Workspaces', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
    cy.intercept('GET', '**/admin/platform/workspaces*', { fixture: 'workspaces.json' }).as('list')
  })

  it('lists workspaces with plan and status', () => {
    cy.visit('/workspaces')
    cy.wait('@list').its('request.url').should('include', 'page=1')

    cy.get('tr[mat-row]').should('have.length', 2)
    cy.contains('tr[mat-row]', 'Acme Legal').should('contain', 'FREE').and('contain', 'ACTIVE')
    cy.contains('tr[mat-row]', 'Globex Research').should('contain', 'PRO').and('contain', 'SUSPENDED')
  })

  it('only offers Suspend for active workspaces', () => {
    cy.visit('/workspaces')
    cy.wait('@list')
    cy.contains('tr[mat-row]', 'Acme Legal').find('button').contains('Suspend').should('exist')
    cy.contains('tr[mat-row]', 'Globex Research').find('button').contains('Suspend').should('not.exist')
  })

  it('suspends a workspace after confirmation', () => {
    cy.intercept('PATCH', '**/admin/platform/workspaces/ws-1/suspend', (req) => {
      req.reply({ statusCode: 200, body: { id: 'ws-1', name: 'Acme Legal', plan: 'FREE', status: 'SUSPENDED',
        owner_email: 'owner@acme.test', member_count: 5, document_count: 40, storage_bytes: 1048576,
        created_at: '2026-09-01T10:00:00Z' } })
    }).as('suspend')

    cy.visit('/workspaces')
    cy.wait('@list')
    cy.on('window:confirm', (text) => {
      expect(text).to.contain('Acme Legal')
      return true
    })
    cy.contains('tr[mat-row]', 'Acme Legal').find('button').contains('Suspend').click()
    cy.wait('@suspend')
    cy.contains('tr[mat-row]', 'Acme Legal').should('contain', 'SUSPENDED')
  })

  it('does not call the API when suspension is cancelled', () => {
    cy.intercept('PATCH', '**/suspend', cy.spy().as('suspendSpy'))
    cy.visit('/workspaces')
    cy.wait('@list')
    cy.on('window:confirm', () => false)
    cy.contains('tr[mat-row]', 'Acme Legal').find('button').contains('Suspend').click()
    cy.get('@suspendSpy').should('not.have.been.called')
  })

  it('upgrades a FREE workspace to PRO', () => {
    cy.intercept('PATCH', '**/admin/platform/workspaces/ws-1/plan', (req) => {
      expect(req.body).to.deep.equal({ plan: 'PRO' })
      req.reply({ statusCode: 200, body: { id: 'ws-1', name: 'Acme Legal', plan: 'PRO', status: 'ACTIVE',
        owner_email: 'owner@acme.test', member_count: 5, document_count: 40, storage_bytes: 1048576,
        created_at: '2026-09-01T10:00:00Z' } })
    }).as('plan')

    cy.visit('/workspaces')
    cy.wait('@list')
    cy.contains('tr[mat-row]', 'Acme Legal').find('button').contains('Upgrade to PRO').click()
    cy.wait('@plan')
    cy.contains('tr[mat-row]', 'Acme Legal').should('contain', 'PRO')
  })
})
