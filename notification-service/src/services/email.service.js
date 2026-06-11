const nodemailer = require('nodemailer')
const handlebars = require('handlebars')
const fs = require('fs')
const path = require('path')
const config = require('../config')
const logger = require('./logger')

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates')

let transporter

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    })
  }
  return transporter
}

function loadTemplate(name) {
  const templatePath = path.join(TEMPLATES_DIR, `${name}.hbs`)
  const layoutPath = path.join(TEMPLATES_DIR, 'layouts', 'base.hbs')
  const templateSource = fs.readFileSync(templatePath, 'utf-8')
  const layoutSource = fs.readFileSync(layoutPath, 'utf-8')

  handlebars.registerPartial('body', templateSource)
  return handlebars.compile(layoutSource)
}

async function sendEmail({ to, subject, template, context }) {
  const compiled = loadTemplate(template)
  const html = compiled({ ...context, appUrl: config.appUrl, year: new Date().getFullYear() })

  const info = await getTransporter().sendMail({
    from: config.smtp.from,
    to,
    subject,
    html,
  })

  logger.info('Email sent', { messageId: info.messageId, to, template })
  return info
}

module.exports = { sendEmail }
