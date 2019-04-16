module.exports = {
  apps : [
    {
      name      : 'education_server',
      script    : 'dist/index.js',
      env: {
        COMMON_VARIABLE: 'true'
      },
      env_production : {
        NODE_ENV: 'production'
      }
    }
  ]
};
