const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const url = require('url')

let mainWindow
let snrWindow
let locateWindow
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 700,
        backgroundColor: "#ccc",
        webPreferences: {
            nodeIntegration: true, // to allow require
            contextIsolation: false, // allow use with Electron 12+
            // preload: path.join(__dirname, 'preload.static_file.js')
        }
    })
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'src/index.html'),
        protocol: 'file:',
        slashes: true
    }))
    mainWindow.on('closed', function () {
        mainWindow = null
    })
    mainWindow.webContents.openDevTools();
}

app.on('ready', createWindow)
app.on('window-all-closed', function () {
    //Cmd + Q
    app.quit()
})

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})

ipcMain.on('toggle-snr-show', () => {
    snrWindow = new BrowserWindow({
        width: 800,
        height: 600,
        backgroundColor: "#ccc",
        webPreferences: {
            nodeIntegration: true, // to allow require
            contextIsolation: false, // allow use with Electron 12+
        }
    })
    snrWindow.loadURL(url.format({
        pathname: path.join(__dirname, '/src/snr.html'),
        protocol: 'file:',
        slashes: true
    }))

    snrWindow.on('close', function () {
        console.log('snr.close')
        mainWindow.webContents.send('snr.close');
        snrWindow = null;
    });

    snrWindow.webContents.openDevTools();
});

ipcMain.on('toggle-snr-hide', () => {
    snrWindow.close();
    snrWindow = null;
});

ipcMain.on('toggle-locate-show', () => {
    locateWindow = new BrowserWindow({
        width: 600,
        height: 500,
        backgroundColor: "#ccc",
        webPreferences: {
            nodeIntegration: true, // to allow require
            contextIsolation: false, // allow use with Electron 12+
        }
    })
    locateWindow.loadURL(url.format({
        pathname: path.join(__dirname, '/src/locate.html'),
        protocol: 'file:',
        slashes: true
    }))
    locateWindow.on('close', function () {
        console.log('locateWindow locate.close')
        locateWindow = null;
        mainWindow.webContents.send('locate.close');
    });
    locateWindow.webContents.openDevTools();


});

ipcMain.on('toggle-locate-hide', () => {
    locateWindow.close();
    locateWindow = null;

});
ipcMain.on('gps.update', (event, data) => {
    if (snrWindow) {
        snrWindow.webContents.send('gps.update', data);
    }
    if (locateWindow) {
        locateWindow.webContents.send('gps.update', data);
    }

});



