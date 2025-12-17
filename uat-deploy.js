const { execSync } = require('child_process');
const path = require('path');

const services = [
  { name: 'learner', build: true },
  { name: 'portal', build: true },
  { name: 'auth', build: false },
  { name: 'vnc', build: false },
  { name: 'masters', build: false },
  { name: 'learnerapi', build: false },
  { name: 'jobs', build: false },
];

const baseDir = 'C:/siberSIM/packages';

function run(command, cwd) {
  console.log(`\n🔷 Running: ${command} in ${cwd}`);
  execSync(command, { stdio: 'inherit', cwd });
}

services.forEach(service => {
  const servicePath = path.join(baseDir, service.name);

  console.log(`\n🚀 Deploying ${service.name}...`);

  // Install dependencies
  run('npm install', servicePath);

  // Build if it's a frontend
  if (service.build) {
    run('npm run build', servicePath);
  }
});

console.log('\n🚀 Starting all services via PM2 ecosystem.config.js...');
run('pm2 start ecosystem.config.js', path.resolve(baseDir, '..'));
run('pm2 save', path.resolve(baseDir, '..'));

console.log('\n✅ All services are running via PM2.');
