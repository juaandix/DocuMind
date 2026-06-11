const Redis = require('ioredis')
const config = require('../config')
const { enqueue } = require('../services/queue.service')
const logger = require('../services/logger')

const CHANNEL = 'notifications'

function startSubscriber() {
  const subscriber = new Redis(config.redisUrl)

  subscriber.on('connect', () => logger.info('Redis subscriber connected'))
  subscriber.on('error', (err) => logger.error('Redis subscriber error', { error: err.message }))

  subscriber.subscribe(CHANNEL, (err, count) => {
    if (err) {
      logger.error('Failed to subscribe to Redis channel', { channel: CHANNEL, error: err.message })
      return
    }
    logger.info(`Subscribed to ${count} Redis channel(s)`, { channel: CHANNEL })
  })

  subscriber.on('message', async (channel, message) => {
    if (channel !== CHANNEL) return

    let event
    try {
      event = JSON.parse(message)
    } catch {
      logger.warn('Received malformed Redis message', { message })
      return
    }

    logger.debug('Received notification event', { type: event.type })

    try {
      await enqueue(event.type, event)
    } catch (err) {
      logger.error('Failed to enqueue notification', { error: err.message, event })
    }
  })

  return subscriber
}

module.exports = { startSubscriber }
