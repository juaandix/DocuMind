jest.mock('../../src/services/notification.service')
jest.mock('jsonwebtoken')

const request = require('supertest')
const jwt = require('jsonwebtoken')
const notificationService = require('../../src/services/notification.service')

process.env.REDIS_URL = 'redis://localhost:6379'
process.env.MONGODB_URI = 'mongodb://localhost:27017/test'
process.env.JWT_SECRET = 'test-secret-min-16-chars'
process.env.SMTP_HOST = 'smtp.example.com'

const app = require('../../src/index')

const MOCK_USER = { sub: 'user-id-1', workspace_id: 'ws-1' }

beforeAll(() => {
  jwt.verify.mockReturnValue(MOCK_USER)
})

describe('GET /notifications', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/notifications')
    expect(res.status).toBe(401)
  })

  it('returns notifications for authenticated user', async () => {
    notificationService.listForUser.mockResolvedValue([{ id: '1', title: 'Test' }])
    const res = await request(app).get('/notifications').set('Authorization', 'Bearer valid-token')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
  })
})

describe('GET /notifications/unread-count', () => {
  it('returns count', async () => {
    notificationService.unreadCount.mockResolvedValue(3)
    const res = await request(app).get('/notifications/unread-count').set('Authorization', 'Bearer valid-token')
    expect(res.status).toBe(200)
    expect(res.body.count).toBe(3)
  })
})

describe('PATCH /notifications/:id/read', () => {
  it('returns 404 if not found', async () => {
    notificationService.markRead.mockResolvedValue(null)
    const res = await request(app).patch('/notifications/unknown-id/read').set('Authorization', 'Bearer valid-token')
    expect(res.status).toBe(404)
  })

  it('returns updated notification', async () => {
    notificationService.markRead.mockResolvedValue({ id: '1', read: true })
    const res = await request(app).patch('/notifications/1/read').set('Authorization', 'Bearer valid-token')
    expect(res.status).toBe(200)
    expect(res.body.read).toBe(true)
  })
})
