const { Router } = require('express')
const Joi = require('joi')
const jwt = require('jsonwebtoken')
const config = require('../config')
const notificationService = require('../services/notification.service')

const router = Router()

function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ detail: 'Unauthorized' })
  try {
    req.user = jwt.verify(header.slice(7), config.jwtSecret)
    next()
  } catch {
    res.status(401).json({ detail: 'Invalid token' })
  }
}

const paginationSchema = Joi.object({
  skip: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(1).max(100).default(20),
})

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { value } = paginationSchema.validate(req.query)
    const notifications = await notificationService.listForUser(req.user.sub, value)
    res.json(notifications)
  } catch (err) {
    next(err)
  }
})

router.get('/unread-count', authenticate, async (req, res, next) => {
  try {
    const count = await notificationService.unreadCount(req.user.sub)
    res.json({ count })
  } catch (err) {
    next(err)
  }
})

router.patch('/read-all', authenticate, async (req, res, next) => {
  try {
    await notificationService.markAllRead(req.user.sub)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    const notification = await notificationService.markRead(req.params.id, req.user.sub)
    if (!notification) return res.status(404).json({ detail: 'Notification not found' })
    res.json(notification)
  } catch (err) {
    next(err)
  }
})

module.exports = router
