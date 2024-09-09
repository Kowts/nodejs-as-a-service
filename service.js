const os = require('os');
const { execSync } = require('child_process');
const { Service, EventLogger } = require('node-windows');
const path = require('path');
const fs = require('fs');

// Load configuration file
const configPath = path.join(__dirname, 'config.json');

// Check if the configuration file exists
if (!fs.existsSync(configPath)) {
    console.error('Error: Configuration file not found.');
    process.exit(1);
}

// Load configuration from the file
const config = require(configPath);
const platform = os.platform();
const log = new EventLogger(config.serviceName);

// Resolve the script path from configuration
const scriptPath = path.resolve(__dirname, config.scriptPath);

// Check if the script file exists
if (!fs.existsSync(scriptPath)) {
    log.error(`Error: Cannot find API script at ${scriptPath}`);
    process.exit(1);
}

/**
 * Manages services on macOS using launchd.
 * @param {string} action - The action to perform (install, uninstall, start, stop, restart).
 */
function manageMacService(action) {
    const plistFilePath = `/Library/LaunchDaemons/com.${config.serviceName}.plist`;

    // Define the launchd plist configuration
    const launchdPlist = `
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
        <dict>
            <key>Label</key>
            <string>com.${config.serviceName}</string>
            <key>ProgramArguments</key>
            <array>
                <string>/usr/local/bin/node</string>
                <string>${scriptPath}</string>
            </array>
            <key>RunAtLoad</key>
            <true/>
            <key>StandardOutPath</key>
            <string>/var/log/${config.serviceName}.log</string>
            <key>StandardErrorPath</key>
            <string>/var/log/${config.serviceName}.error.log</string>
        </dict>
    </plist>
    `;

    try {
        switch (action) {
            case 'install':
                fs.writeFileSync(plistFilePath, launchdPlist);
                execSync(`sudo launchctl load -w ${plistFilePath}`);
                log.info('Service successfully installed and started on macOS.');
                break;

            case 'uninstall':
                execSync(`sudo launchctl unload -w ${plistFilePath}`);
                fs.unlinkSync(plistFilePath);
                log.info('Service successfully uninstalled on macOS.');
                break;

            case 'start':
                execSync(`sudo launchctl start com.${config.serviceName}`);
                log.info('Service started on macOS.');
                break;

            case 'stop':
                execSync(`sudo launchctl stop com.${config.serviceName}`);
                log.warn('Service stopped on macOS.');
                break;

            case 'restart':
                execSync(`sudo launchctl stop com.${config.serviceName}`);
                execSync(`sudo launchctl start com.${config.serviceName}`);
                log.info('Service restarted on macOS.');
                break;

            default:
                log.warn('Usage: node service.js <install|uninstall|start|stop|restart>');
        }
    } catch (error) {
        log.error(`Error managing the service on macOS: ${error.message}`);
    }
}

/**
 * Manages services on Linux using systemd.
 * @param {string} action - The action to perform (install, uninstall, start, stop, restart).
 */
function manageLinuxService(action) {
    const serviceName = config.serviceName.toLowerCase();

    // Define the systemd service configuration
    const systemdService = `
        [Unit]
        Description=${config.description}
        After=network.target

        [Service]
        ExecStart=/usr/bin/node ${scriptPath}
        Restart=on-failure
        Environment=NODE_ENV=${config.env.NODE_ENV}
        StandardOutput=syslog
        StandardError=syslog
        SyslogIdentifier=${serviceName}

        [Install]
        WantedBy=multi-user.target
    `;

    const serviceFilePath = `/etc/systemd/system/${serviceName}.service`;

    try {
        switch (action) {
            case 'install':
                fs.writeFileSync(serviceFilePath, systemdService);
                execSync(`sudo systemctl daemon-reload`);
                execSync(`sudo systemctl enable ${serviceName}`);
                execSync(`sudo systemctl start ${serviceName}`);
                log.info('Service successfully installed and started on Linux.');
                break;

            case 'uninstall':
                execSync(`sudo systemctl stop ${serviceName}`);
                execSync(`sudo systemctl disable ${serviceName}`);
                fs.unlinkSync(serviceFilePath);
                execSync(`sudo systemctl daemon-reload`);
                log.info('Service successfully uninstalled on Linux.');
                break;

            case 'start':
                execSync(`sudo systemctl start ${serviceName}`);
                log.info('Service started on Linux.');
                break;

            case 'stop':
                execSync(`sudo systemctl stop ${serviceName}`);
                log.warn('Service stopped on Linux.');
                break;

            case 'restart':
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

/**
 * Manages services on Windows using node-windows.
 * @param {string} action - The action to perform (install, uninstall, start, stop, restart).
 */
function manageWindowsService(action) {
    const svc = new Service({
        name: config.serviceName,
        description: config.description,
        script: scriptPath,
        nodeOptions: config.nodeOptions,
        env: config.env,
        restartOnCrash: true,
        logpath: path.join(__dirname, config.logPath),
        maxRetries: config.retryStrategy.maxRetries,
        wait: config.retryStrategy.wait,
        grow: config.retryStrategy.grow
    });

    svc.on('install', () => {
        log.info('Service successfully installed on Windows.');
        svc.start();
    });

    svc.on('alreadyinstalled', () => {
        log.info('Service is already installed on Windows.');
        svc.start();
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

    switch (action) {
        case 'install':
            svc.exists((exists) => {
                if (!exists) {
                    log.info('Installing the service on Windows...');
                    svc.install();
                } else {
                    log.info('Service already installed on Windows.');
                }
            });
            break;

        case 'uninstall':
            svc.exists((exists) => {
                if (exists) {
                    log.info('Uninstalling the service on Windows...');
                    svc.uninstall();
                } else {
                    log.info('Service is not installed on Windows.');
                }
            });
            break;

        case 'start':
            svc.exists((exists) => {
                if (exists) {
                    log.info('Starting the service on Windows...');
                    svc.start();
                } else {
                    log.error('Service is not installed on Windows.');
                }
            });
            break;

        case 'stop':
            svc.exists((exists) => {
                if (exists) {
                    log.warn('Stopping the service on Windows...');
                    svc.stop();
                } else {
                    log.error('Service is not installed on Windows.');
                }
            });
            break;

        case 'restart':
            svc.exists((exists) => {
                if (exists) {
                    log.info('Restarting the service on Windows...');
                    svc.restart();
                } else {
                    log.error('Service is not installed on Windows.');
                }
            });
            break;

        default:
            log.warn('Usage: node service.js <install|uninstall|start|stop|restart>');
    }
}

/**
 * Checks the status of the service based on the platform.
 */
function checkServiceStatus() {
    if (platform === 'win32') {
        // Windows: Check service status using `sc query`
        try {
            const status = execSync(`sc query ${config.serviceName}`).toString();
            log.info(`Service status on Windows: ${status}`);
        } catch (error) {
            log.error(`Error checking service status on Windows: ${error.message}`);
        }
    } else if (platform === 'linux') {
        // Linux: Check service status using `systemctl`
        try {
            const status = execSync(`systemctl status ${config.serviceName.toLowerCase()}`).toString();
            log.info(`Service status on Linux: ${status}`);
        } catch (error) {
            log.error(`Error checking service status on Linux: ${error.message}`);
        }
    } else if (platform === 'darwin') {
        // macOS: Check service status using `launchctl`
        try {
            const status = execSync(`launchctl list | grep com.${config.serviceName}`).toString();
            log.info(`Service status on macOS: ${status}`);
        } catch (error) {
            log.error(`Error checking service status on macOS: ${error.message}`);
        }
    }
}

// Handle command-line arguments
const action = process.argv[2]; // Get the action from command-line arguments (install, uninstall, start, stop, restart, status)

if (action === 'status') {
    checkServiceStatus();
} else if (platform === 'win32') {
    manageWindowsService(action);
} else if (platform === 'linux') {
    manageLinuxService(action);
} else if (platform === 'darwin') {
    manageMacService(action);
} else {
    log.error('Unsupported platform. This script only works on Windows, Linux, or macOS.');
}
