// Import required modules
const os = require('os');
const { execSync } = require('child_process');
const { Service, EventLogger } = require('node-windows');
const path = require('path');
const fs = require('fs');

// Determine the current operating system platform (e.g., 'win32' for Windows, 'linux' for Linux)
const platform = os.platform();

// Set up a logger for logging events, specific to the service
const log = new EventLogger('MyNodeApiService');

// Define the path to the Node.js API script (e.g., app.js), assuming it's in the same directory as the service script
const scriptPath = path.join(__dirname, 'app.js');

// Check if the API script file exists in the specified location
if (!fs.existsSync(scriptPath)) {
    log.error(`Error: Cannot find API script at ${scriptPath}`);
    process.exit(1); // Exit if the script does not exist
}

// Function to manage services on Linux using systemd
function manageLinuxService(action) {
    const serviceName = 'mynodeapiservice'; // Define the Linux service name

    // Define the content of the systemd service configuration file
    const systemdService = `
        [Unit]
        Description=Node.js API running as a Linux service
        After=network.target

        [Service]
        ExecStart=/usr/bin/node ${scriptPath}  // Path to run the API script using node
        Restart=on-failure                    // Automatically restart the service on failure
        Environment=NODE_ENV=production       // Set environment variable for production mode
        StandardOutput=syslog                 // Log standard output to syslog
        StandardError=syslog                  // Log errors to syslog
        SyslogIdentifier=${serviceName}       // Identifier for logs

        [Install]
        WantedBy=multi-user.target
    `;

    // Define the path to store the systemd service configuration file
    const serviceFilePath = `/etc/systemd/system/${serviceName}.service`;

    try {
        // Switch case to manage different actions (install, uninstall, start, stop, restart) on Linux
        switch (action) {
            case 'install':
                // Write the systemd service configuration file
                fs.writeFileSync(serviceFilePath, systemdService);
                // Reload systemd, enable and start the service
                execSync(`sudo systemctl daemon-reload`);
                execSync(`sudo systemctl enable ${serviceName}`);
                execSync(`sudo systemctl start ${serviceName}`);
                log.info('Service successfully installed and started on Linux.');
                break;

            case 'uninstall':
                // Stop and disable the service, then remove the service file
                execSync(`sudo systemctl stop ${serviceName}`);
                execSync(`sudo systemctl disable ${serviceName}`);
                fs.unlinkSync(serviceFilePath); // Remove the service file
                execSync(`sudo systemctl daemon-reload`);
                log.info('Service successfully uninstalled on Linux.');
                break;

            case 'start':
                // Start the service
                execSync(`sudo systemctl start ${serviceName}`);
                log.info('Service started on Linux.');
                break;

            case 'stop':
                // Stop the service
                execSync(`sudo systemctl stop ${serviceName}`);
                log.warn('Service stopped on Linux.');
                break;

            case 'restart':
                // Restart the service
                execSync(`sudo systemctl restart ${serviceName}`);
                log.info('Service restarted on Linux.');
                break;

            default:
                log.warn('Usage: node service.js <install|uninstall|start|stop|restart>');
        }
    } catch (error) {
        log.error(`Error managing the service on Linux: ${error.message}`);
    }
}

// Function to manage services on Windows using node-windows package
function manageWindowsService(action) {
    // Create a new service object with necessary configurations for Windows
    const svc = new Service({
        name: 'MyNodeApiService', // The name of the service
        description: 'Node.js API running as a Windows service', // Service description
        script: scriptPath, // Path to the API script (e.g., app.js)
        nodeOptions: [
            '--harmony', // Enable Harmony features in Node.js
            '--max_old_space_size=4096' // Increase memory limit
        ],
        env: {
            name: 'NODE_ENV',
            value: 'production' // Set environment variable to production
        },
        restartOnCrash: true, // Automatically restart the service on crash
        logpath: path.join(__dirname, 'logs'), // Path to store log files
        maxRetries: 3, // Maximum number of restart attempts
        wait: 1, // Wait 1 second before restarting
        grow: 0.5 // Increase wait time by 50% after each failure
    });

    // Event listeners for different service actions on Windows
    svc.on('install', () => {
        log.info('Service successfully installed on Windows.');
        svc.start(); // Start service after installation
    });

    svc.on('alreadyinstalled', () => {
        log.info('Service is already installed on Windows.');
        svc.start(); // Start service if already installed
    });

    svc.on('start', () => {
        log.info('Service started on Windows.');
    });

    svc.on('stop', () => {
        log.warn('Service stopped on Windows.');
    });

    svc.on('restart', () => {
        log.info('Service restarted on Windows.');
    });

    svc.on('uninstall', () => {
        log.info('Service uninstalled on Windows.');
    });

    svc.on('error', (err) => {
        log.error(`Service encountered an error on Windows: ${err}`);
    });

    // Switch case to manage different actions (install, uninstall, start, stop, restart) on Windows
    switch (action) {
        case 'install':
            svc.exists((exists) => {
                if (!exists) {
                    log.info('Installing the service on Windows...');
                    svc.install(); // Install the service if it doesn't exist
                } else {
                    log.info('Service already installed on Windows.');
                }
            });
            break;

        case 'uninstall':
            svc.exists((exists) => {
                if (exists) {
                    log.info('Uninstalling the service on Windows...');
                    svc.uninstall(); // Uninstall the service if it exists
                } else {
                    log.info('Service is not installed on Windows.');
                }
            });
            break;

        case 'start':
            svc.exists((exists) => {
                if (exists) {
                    log.info('Starting the service on Windows...');
                    svc.start(); // Start the service if installed
                } else {
                    log.error('Service is not installed on Windows.');
                }
            });
            break;

        case 'stop':
            svc.exists((exists) => {
                if (exists) {
                    log.warn('Stopping the service on Windows...');
                    svc.stop(); // Stop the service if installed
                } else {
                    log.error('Service is not installed on Windows.');
                }
            });
            break;

        case 'restart':
            svc.exists((exists) => {
                if (exists) {
                    log.info('Restarting the service on Windows...');
                    svc.restart(); // Restart the service if installed
                } else {
                    log.error('Service is not installed on Windows.');
                }
            });
            break;

        default:
            log.warn('Usage: node service.js <install|uninstall|start|stop|restart>');
    }
}

// Handle command-line arguments to decide the action (install, uninstall, start, stop, restart)
const action = process.argv[2];

if (platform === 'win32') {
    manageWindowsService(action); // Run Windows service management
} else if (platform === 'linux') {
    manageLinuxService(action); // Run Linux service management
} else {
    log.error('Unsupported platform. This script only works on Windows or Linux.');
}
