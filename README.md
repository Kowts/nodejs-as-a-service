# Node.js API Windows Service

This project provides a simple script to run a Node.js API as a Windows service using the `node-windows` package. The service will automatically start when the system boots, and it is configured to restart on failure. The service can be installed, uninstalled, started, stopped, and restarted via the command line.

## Features

- Automatically runs a Node.js API as a Windows service
- Configured to restart automatically on crashes
- Supports logging to both files and Windows Event Viewer
- Handles service installation, uninstallation, starting, stopping, and restarting

## Prerequisites

- [Node.js](https://nodejs.org/) (version 12 or higher)
- [npm](https://www.npmjs.com/)
- Windows operating system

## Installation

1. Clone this repository or copy the `service.js` script into your project directory.
2. Install the required dependencies:

```bash
npm install
```
3. Ensure that your Node.js API script (app.js or another entry point) is located in the same directory as service.js.

## Usage and Feature

### Install the Service
To install the Node.js API as a Windows service, run the following command in your terminal:
```bash
npm run install-service
```

### Uninstall the Service
To uninstall the service, use:
```bash
npm run uninstall-service
```

### Start the Service
To manually start the service if it's installed:
```bash
npm run start-service
```

### Stop the Service
To manually stop the service:
```bash
npm run stop-service
```

### Restart the Service
To restart the service:
```bash
npm run restart-service
```

## Logs

Logs will be saved in the logs directory (created automatically in the same folder as service.js).
The service also logs important events to the Windows Event Viewer under Applications and Services Logs > MyNodeApiService.

## Error Handling

If the service crashes, it will attempt to restart automatically up to 3 times, with increasing wait times between each attempt. All service actions (start, stop, install, etc.) are logged for easy debugging.
Customization

You can modify the service configuration (e.g., service name, description, environment variables) inside the service.js file to fit your needs.

## License

This project is open source and available under the MIT License.
