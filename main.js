const { app, BrowserWindow, session, Notification, ipcMain } = require('electron');
const path = require('path');

// Set app name for macOS dock
app.setName('Vibe Messenger');

// Set userData path to ensure session persistence (must be before app ready)
app.setPath('userData', path.join(app.getPath('appData'), 'MessengerDesktop'));

let mainWindow;

// Handle native notifications from renderer
ipcMain.on('show-notification', (event, { title, body, icon }) => {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: title || 'Messenger',
      body: body || '',
      icon: icon || undefined,
      silent: false
    });

    notification.on('click', () => {
      // Focus the window when notification is clicked
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });

    notification.show();
  }
});

function createWindow() {
  // Use default session for persistence (stored in userData)
  const ses = session.defaultSession;

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 400,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      // Allow running in the background
      backgroundThrottling: false
    },
    // App appearance
    title: 'Vibe Messenger',
    show: false, // Don't show until ready
    backgroundColor: '#ffffff'
  });

  // Set a modern User-Agent to avoid blocks
  const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  mainWindow.webContents.setUserAgent(userAgent);

  // Handle permission requests (for notifications)
  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['notifications', 'media', 'mediaKeySystem', 'geolocation'];
    if (allowedPermissions.includes(permission)) {
      callback(true);
    } else {
      callback(false);
    }
  });

  // Load Messenger
  mainWindow.loadURL('https://www.messenger.com');

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle new window requests (open in same window for login flow)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Allow Facebook login flow in the same window
    if (url.includes('facebook.com') || url.includes('messenger.com')) {
      mainWindow.loadURL(url);
      return { action: 'deny' };
    }
    // Open other links externally
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  // Inject notification handler
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      // Ensure notifications work properly
      if (Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
    `);
  });
}

// App ready
app.whenReady().then(async () => {
  // Request notification permission on macOS
  if (process.platform === 'darwin') {
    const { systemPreferences } = require('electron');
    // Check notification permission
    const status = systemPreferences.getNotificationSettings
      ? systemPreferences.getNotificationSettings().authorizationStatus
      : null;

    console.log('Notification permission status:', status);

    // Show a test notification to trigger permission dialog
    if (Notification.isSupported()) {
      const testNotification = new Notification({
        title: 'Messenger Desktop',
        body: 'Les notifications sont activées !',
        silent: true
      });
      testNotification.show();
    }
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle certificate errors (for self-signed certs during development)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  // Only for messenger.com and facebook.com
  if (url.includes('messenger.com') || url.includes('facebook.com')) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});
