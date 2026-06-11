const Bull = require('bull')
const config = require('../config')
const logger = require('./logger')

const notificationQueue = new Bull('notifications', config.redisUrl, {
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
})

notificationQueue.on('failed', (job, err) => {
  logger.error('Notification job failed', { jobId: job.id, attempt: job.attemptsMade, error: err.message })
})

notificationQueue.on('completed', (job) => {
  logger.debug('Notification job completed', { jobId: job.id })
})

async function enqueue(type, payload) {
  const job = await notificationQueue.add(type, payload, { priority: type === 'workspace_invite' ? 1 : 5 })
  logger.info('Notification enqueued', { jobId: job.id, type })
  return job
}

module.exports = { notificationQueue, enqueue }
