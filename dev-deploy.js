const concurrently = require('concurrently');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runService(service) {
  console.log(`Starting service: ${service.name}`);
  try {
    await concurrently([service], {
      prefix: 'name',
      killOthers: ['failure', 'success'],
      restartTries: 3,
    });
    console.log(`Service started successfully: ${service.name}`);
  } catch (error) {
    console.error(`Error starting service: ${service.name}`);
    process.exit(1);
  }
}

async function runServices() {
  // Define services
  
  const services = [
    { command: 'npm --prefix packages/auth run start', name: 'auth', prefixColor: 'orange' },
    { command: 'npm --prefix packages/masters run start', name: 'masters', prefixColor: 'green' },
    { command: 'npm --prefix packages/learnerapi run start', name: 'learnerapi', prefixColor: 'yellow' },
    { command: 'npm --prefix packages/jobs run start', name: 'jobs', prefixColor: 'magenta' },
    { command: 'npm --prefix packages/vnc run start', name: 'vnc', prefixColor: 'cyan' },
    { command: 'npm --prefix packages/webhook run dev', name: 'webhook', prefixColor: 'gray' },
    { command: 'npm --prefix packages/portal run dev', name: 'portal', prefixColor: 'red', dependsOn: 'auth' },
    { command: 'npm --prefix packages/learner run dev', name: 'learner', prefixColor: 'blue', dependsOn: 'auth' },
  ];


  // Start auth service first
  const authService = services.find(service => service.name === 'auth');
  await runService(authService);

  // Delay after auth
  console.log(`Delaying for 5 seconds before starting dependent services...`);
  await sleep(5 * 1000);

  // Start dependent services
  const dependentServices = services.filter(service => service.dependsOn === 'auth');
  for (const service of dependentServices) {
    await runService(service);
  }

  // Start other services
  const otherServices = services.filter(
    service => service.name !== 'auth' && !service.dependsOn
  );
  for (const service of otherServices) {
    runService(service);
  }

  console.log('All services have been started.');
}

runServices();
