// Default env for tests so config validation passes without a .env file
process.env.NODE_ENV = 'test'
process.env.REDIS_URL ??= 'redis://localhost:6379'
process.env.MONGODB_URI ??= 'mongodb://localhost:27017/test'
process.env.JWT_SECRET ??= 'test-secret-min-16-chars'
process.env.SMTP_HOST ??= 'smtp.example.com'
