const { Service, EventLogger } = require('node-windows');
const path = require('path');
const fs = require('fs');

// Set up a logger for the service
const log = new EventLogger('MyNodeApiService');

// Get the directory where the script is located (assuming the API is in the same folder)
const scriptPath = path.join(__dirname, 'app.js');

// Check if the script file exists
if (!fs.existsSync(scriptPath)) {
  log.error(`Error: Cannot find API script at ${scriptPath}`);
  process.exit(1);
}

// Create a new service object
const svc = new Service({
  name: 'MyNodeApiService',
  description: 'Node.js API running as a Windows service',
  script: scriptPath,  // Automatically uses the current folder for the API
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ],
  env: {
    name: 'NODE_ENV',
    value: 'production'
  },
  // Set the service to automatically restart if it crashes
  restartOnCrash: true,
  logpath: path.join(__dirname, 'logs'),  // Specify a directory for logs
  maxRetries: 3,  // Maximum number of restart attempts in case of failure
  wait: 1,  // Wait 1 second before restarting on failure
  grow: .5  // Increase wait time by 50% after each failure
});

// Listen for the "install" event, which indicates the service is installed
svc.on('install', () => {
  log.info('Service successfully installed.');
  svc.start();
});

// Listen for the "alreadyinstalled" event
svc.on('alreadyinstalled', () => {
  log.info('Service is already installed.');
  svc.start();
});

// Listen for the "start" event and log success
svc.on('start', () => {
  log.info('Service started successfully.');
});

// Listen for the "stop" event
svc.on('stop', () => {
  log.warn('Service stopped.');
});

// Listen for the "restart" event
svc.on('restart', () => {
  log.info('Service restarted successfully.');
});

// Listen for errors during service operations
svc.on('error', (err) => {
  log.error(`Service encountered an error: ${err}`);
});

// Listen for the "uninstall" event
svc.on('uninstall', () => {
  log.info('Service uninstalled.');
});

// Handle command-line arguments
const action = process.argv[2]; // Get the action from command-line (install, uninstall, start, stop, restart)

switch (action) {
  case 'install':
    svc.exists((exists) => {
      if (!exists) {
        log.info('Installing the service...');
        svc.install();
      } else {
        log.info('Service already installed.');
      }
    });
    break;

  case 'uninstall':
    svc.exists((exists) => {
      if (exists) {
        log.info('Uninstalling the service...');
        svc.uninstall();
      } else {
        log.info('Service is not installed.');
      }
    });
    break;

  case 'start':
    svc.exists((exists) => {
      if (exists) {
        log.info('Starting the service...');
        svc.start();
      } else {
        log.error('Service is not installed.');
      }
    });
    break;

  case 'stop':
    svc.exists((exists) => {
      if (exists) {
        log.warn('Stopping the service...');
        svc.stop();
      } else {
        log.error('Service is not installed.');
      }
    });
    break;

  case 'restart':
    svc.exists((exists) => {
      if (exists) {
        log.info('Restarting the service...');
        svc.restart();
      } else {
        log.error('Service is not installed.');
      }
    });
    break;

  default:
    log.warn('Usage: node service.js <install|uninstall|start|stop|restart>');
    break;
}
