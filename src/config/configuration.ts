export default () => ({
  api: {
    port: process.env.PORT,
    host: process.env.HOST,
    cors_origin: process.env.CORS_ORIGIN,
  },
});
