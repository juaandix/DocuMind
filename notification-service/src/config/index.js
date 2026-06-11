const Joi = require('joi')

const schema = Joi.object({
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  REDIS_URL: Joi.string().uri().required(),
  MONGODB_URI: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().allow('').default(''),
  SMTP_PASS: Joi.string().allow('').default(''),
  EMAIL_FROM: Joi.string().default('DocuMind <noreply@documind.app>'),
  APP_URL: Joi.string().uri().default('http://localhost:5173'),
}).unknown(true)

const { error, value } = schema.validate(process.env)
if (error) {
  throw new Error(`Config validation error: ${error.message}`)
}

module.exports = {
  port: value.PORT,
  nodeEnv: value.NODE_ENV,
  redisUrl: value.REDIS_URL,
  mongodbUri: value.MONGODB_URI,
  jwtSecret: value.JWT_SECRET,
  smtp: {
    host: value.SMTP_HOST,
    port: value.SMTP_PORT,
    user: value.SMTP_USER,
    pass: value.SMTP_PASS,
    from: value.EMAIL_FROM,
  },
  appUrl: value.APP_URL,
}
