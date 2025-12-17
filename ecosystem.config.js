module.exports = {
  apps: [
    {
      name: 'learner',
      cwd: './packages/learner',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 4000',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'portal',
      cwd: './packages/portal',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 4001',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'auth',
      cwd: './packages/auth/src',
      script: 'index.js',  // Replace with your actual entry file
      env: {
        NODE_ENV: 'production',
        PORT: 4002
      }
    },
    {
      name: 'vnc',
      cwd: './packages/vnc',
      script: 'index.js',  // Replace with your actual entry file
      env: {
        NODE_ENV: 'production',
        PORT: 4007
      }
    },
    {
      name: 'masters',
      cwd: './packages/masters/src',
      script: 'index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4003
      }
    },
    {
      name: 'learnerapi',
      cwd: './packages/learnerapi/src',
      script: 'index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4004
      }
    },
    {
      name: 'jobs',
      cwd: './packages/jobs/src',
      script: 'index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4005
      }
    }
  ]
};
