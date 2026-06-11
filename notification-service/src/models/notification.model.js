const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
  {
    workspace_id: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    type: {
      type: String,
      enum: ['document_ready', 'document_error', 'workspace_invite', 'export_ready', 'storage_warning'],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    metadata: {
      document_id: { type: mongoose.Schema.Types.ObjectId, default: null },
      room_id: { type: mongoose.Schema.Types.ObjectId, default: null },
      invite_token: { type: String, default: null },
    },
    read: { type: Boolean, default: false, index: true },
    email_sent: { type: Boolean, default: false },
    email_sent_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
)

notificationSchema.index({ user_id: 1, read: 1, created_at: -1 })

module.exports = mongoose.model('Notification', notificationSchema)
