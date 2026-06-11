const Notification = require('../models/notification.model')

const TEMPLATES = {
  document_ready: { subject: 'Tu documento está listo para consultar', template: 'document-ready' },
  document_error: { subject: 'Error al procesar tu documento', template: 'document-error' },
  workspace_invite: { subject: 'Te han invitado a un workspace en DocuMind', template: 'workspace-invite' },
  export_ready: { subject: 'Tu exportación está lista para descargar', template: 'export-ready' },
  storage_warning: { subject: 'Aviso: límite de almacenamiento próximo', template: 'storage-warning' },
}

async function createNotification({ workspace_id, user_id, type, title, body, metadata = {} }) {
  return Notification.create({ workspace_id, user_id, type, title, body, metadata })
}

async function listForUser(userId, { skip = 0, limit = 20 } = {}) {
  return Notification.find({ user_id: userId })
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
}

async function markRead(notificationId, userId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user_id: userId },
    { $set: { read: true } },
    { new: true }
  )
}

async function markAllRead(userId) {
  return Notification.updateMany({ user_id: userId, read: false }, { $set: { read: true } })
}

async function unreadCount(userId) {
  return Notification.countDocuments({ user_id: userId, read: false })
}

async function markEmailSent(notificationId) {
  return Notification.findByIdAndUpdate(notificationId, {
    $set: { email_sent: true, email_sent_at: new Date() },
  })
}

function getEmailConfig(type) {
  return TEMPLATES[type] ?? null
}

module.exports = { createNotification, listForUser, markRead, markAllRead, unreadCount, markEmailSent, getEmailConfig }
