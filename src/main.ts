// This is the main process of the Electron application.
// It initializes the Electron app and creates the main window.
// It also loads the Angular application from the specified path.
// It is responsible for managing the lifecycle of the application and handling events.
import { app, BrowserWindow } from 'electron';
import express from 'express';
import path from 'path';
import cors from 'cors';

let mainWindow: BrowserWindow | null = null;

const PORT = 3000;
const server = express();

// Allow all origins
server.use(cors());

// Serve Angular frontend from 'ui/dist'
server.use(express.static(path.join(__dirname, '../ui/dist')));

// Start Express server
server.listen(PORT, () => {
    console.log(`Lokaler Server läuft auf http://localhost:${PORT}`);
});

// 🔹 Add the /ping endpoint
server.get('/ping', (req, res) => {
    res.status(200).json({ status: 'pong', timestamp: new Date().toISOString() });
});

// Create the Electron window when ready
app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        fullscreen: false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    mainWindow.maximize();
    mainWindow.loadURL(`http://localhost:${PORT}/index.html`);
});
