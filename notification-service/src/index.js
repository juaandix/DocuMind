require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const config = require('./config')
const logger = require('./services/logger')
const { startSubscriber } = require('./subscribers/redis.subscriber')
const notificationsRouter = require('./routes/notifications')

// Start notification worker (registers Bull processor)
require('./workers/notification.worker')

const app = express()
app.use(express.json())

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'notification-service' }))
app.use('/notifications', notificationsRouter)

app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack })
  res.status(500).json({ detail: 'Internal server error' })
})

async function start() {
  await mongoose.connect(config.mongodbUri)
  logger.info('MongoDB connected')

  startSubscriber()

  app.listen(config.port, () => {
    logger.info(`Notification service listening on port ${config.port}`)
  })
}

start().catch((err) => {
  logger.error('Failed to start notification service', { error: err.message })
  process.exit(1)
})

module.exports = app
