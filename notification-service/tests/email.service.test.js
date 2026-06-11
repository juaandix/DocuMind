jest.mock('nodemailer')
jest.mock('fs')

const nodemailer = require('nodemailer')
const fs = require('fs')

const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' })
nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail })

fs.readFileSync.mockImplementation((filePath) => {
  if (filePath.includes('layouts/base.hbs')) return '<html>{{> body}}</html>'
  return '<p>Hello {{userName}}</p>'
})

const { sendEmail } = require('../src/services/email.service')

describe('EmailService', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls sendMail with correct to and subject', async () => {
    await sendEmail({ to: 'test@example.com', subject: 'Test', template: 'document-ready', context: { userName: 'Juan' } })
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'test@example.com', subject: 'Test' }))
  })

  it('renders userName into html', async () => {
    await sendEmail({ to: 'a@b.com', subject: 'S', template: 'document-ready', context: { userName: 'Ana' } })
    const call = mockSendMail.mock.calls[0][0]
    expect(call.html).toContain('Ana')
  })
})
