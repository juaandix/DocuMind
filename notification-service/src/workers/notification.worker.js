const { notificationQueue } = require('../services/queue.service')
const { sendEmail } = require('../services/email.service')
const { markEmailSent, getEmailConfig } = require('../services/notification.service')
const logger = require('../services/logger')

notificationQueue.process(async (job) => {
  const { notificationId, userEmail, userName, type, metadata } = job.data
  logger.info('Processing notification job', { jobId: job.id, type, notificationId })

  const emailConfig = getEmailConfig(type)
  if (!emailConfig) {
    logger.warn('No email template for type', { type })
    return
  }

  await sendEmail({
    to: userEmail,
    subject: emailConfig.subject,
    template: emailConfig.template,
    context: { userName, ...metadata },
  })

  if (notificationId) {
    await markEmailSent(notificationId)
  }
})

logger.info('Notification worker started')
