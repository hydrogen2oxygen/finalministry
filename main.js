// This is the main process of the Electron application.
// It initializes the Electron app and creates the main window.
// It also loads the Angular application from the specified path.
// It is responsible for managing the lifecycle of the application and handling events.
const { app, BrowserWindow } = require('electron');
const express = require('express');
const path = require('path');

let mainWindow;
const server = express();

// Statische Dateien aus `dist/` bereitstellen
server.use(express.static(path.join(__dirname, 'ui/dist')));

// Starte den Server auf einer lokalen Portnummer
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Lokaler Server läuft auf http://localhost:${PORT}`);
});

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({ width: 800, height: 600 });
    mainWindow.loadURL(`http://localhost:${PORT}/`);
});
