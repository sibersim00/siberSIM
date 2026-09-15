const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const services = [
  { name: 'learner', build: true },
  { name: 'portal', build: true },
  { name: 'auth', build: false },
  { name: 'vnc', build: false },
  { name: 'masters', build: false },
  { name: 'learnerapi', build: false },
  { name: 'jobs', build: false },
  { name: 'webhook', build: false },
];

const baseDir = '/home/siberSIM/packages';

// PM2 ecosystem.config.js root (parent of packages)
const projectRoot = path.resolve(baseDir, '..');

// Maintenance flag — must match nginx.conf's check path exactly
const maintenanceDir = '/home/siberSIM/maintenance';
const maintenanceFile = path.join(maintenanceDir, 'maintenance.flag');

function run(command, cwd) {
  console.log(`\n🔷 Running: ${command}`);
  console.log(`📂 Directory: ${cwd}`);

  execSync(command, {
    stdio: 'inherit',
    cwd,
  });
}

function enableMaintenance() {
  console.log('\n🚧 Enabling maintenance mode...');

  if (!fs.existsSync(maintenanceDir)) {
    fs.mkdirSync(maintenanceDir, { recursive: true });
  }

  fs.writeFileSync(maintenanceFile, 'maintenance');
  console.log(`✅ Maintenance flag created: ${maintenanceFile}`);
}

function disableMaintenance() {
  if (fs.existsSync(maintenanceFile)) {
    fs.unlinkSync(maintenanceFile);
    console.log('\n✅ Maintenance mode disabled.');
  }
}

try {
  enableMaintenance();

  services.forEach((service) => {
    const servicePath = path.join(baseDir, service.name);

    console.log(`\n🚀 Deploying ${service.name}...`);

    if (!fs.existsSync(servicePath)) {
      throw new Error(`Service directory not found: ${servicePath}`);
    }

    // Install dependencies
    run('npm install', servicePath);

    // Build if it's a frontend
    if (service.build) {
      run('npm run build', servicePath);
    }
  });

  console.log('\n🚀 Starting/Reloading all services via PM2 ecosystem.config.js...');
  run('pm2 startOrReload ecosystem.config.js', projectRoot);
  run('pm2 save', projectRoot);

  disableMaintenance();

  console.log('\n✅ All services are running via PM2.');
  console.log('✅ Deployment completed successfully.');

} catch (error) {
  console.error('\n❌ Deployment failed.');
  console.error(error.message);

  console.log(
    '\n🚧 Maintenance mode remains ENABLED because deployment failed.'
  );

  process.exit(1);
}