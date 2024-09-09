# Node.js API as a Service

This project provides a simple solution to run a Node.js API as a system service on both Windows (using the `node-windows` package) and Linux (using `systemd`). The service will automatically start when the system boots and is configured to restart in case of failure. This script allows easy installation, uninstallation, starting, stopping, and restarting of the service from the command line.

## Features

- Automatically run a Node.js API as a system service on both Windows and Linux
- Configured to restart on failure (up to 3 attempts)
- Logging support (file logs and Event Viewer on Windows)
- Easily manage the service lifecycle with install, uninstall, start, stop, and restart commands
- Cross-platform: Supports both Windows and Linux

## Prerequisites

- [Node.js](https://nodejs.org/) (version 12 or higher)
- [npm](https://www.npmjs.com/)
- Either Windows or Linux operating system

## Installation

1. Clone this repository or copy the `service.js` script into your project directory.
2. In the root of your project directory (where `service.js` is located), run:
```bash
npm install
```
3. Ensure your Node.js API script (e.g., `app.js`) is located in the same directory as `service.js`.

## Usage and Feature

### Install the Service
To install the Node.js API as a system service:
- Windows
```bash
npm run install-service
```
- Linux:
```bash
sudo node service.js install
```

### Uninstall the Service
To uninstall the service, use:
- Windows
```bash
npm run uninstall-service
```
- Linux:
```bash
sudo node service.js uninstall
```

### Start the Service
To manually start the service if it's installed:
- Windows
```bash
npm run start-service
```
- Linux:
```bash
sudo node service.js start
```

### Stop the Service
To manually stop the service:
- Windows
```bash
npm run stop-service
```
- Linux:
```bash
sudo node service.js stop
```

### Restart the Service
- Windows
To restart the service:
```bash
npm run restart-service
```
- Linux:
```bash
sudo node service.js restart
```

## Logs

Logs will be saved in the logs directory (created automatically in the same folder as service.js).
- Windows: Logs will be written to the Event Viewer under Applications and Services Logs > `MyNodeApiService`.
- Linux: Logs will be accessible using the `journalctl` command, e.g.,
```bash
sudo journalctl -u mynodeapiservice
```
Additionally, a log directory is created in the same folder as `service.js`, where logs are saved for both platforms.

## Error Handling

If the service crashes, it will attempt to restart automatically up to 3 times, with increasing wait times between each attempt. All service actions (start, stop, install, etc.) are logged for easy debugging.

### Customization

You can modify the service configuration (e.g., service name, description, environment variables) inside the `service.js` file to fit your needs.

## License

This project is open source and available under the MIT License.
