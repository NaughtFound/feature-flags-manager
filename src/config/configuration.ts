export default () => ({
  api: {
    port: process.env.PORT,
    host: process.env.HOST,
    cors_origin: process.env.CORS_ORIGIN,
  },
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    db_name: process.env.DB_NAME,
  },
  auth: {
    jwt_secret: process.env.JWT_SECRET,
    jwt_expires_in: process.env.JWT_EXP_IN,
  },
});
