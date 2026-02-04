import { app, shell, BrowserWindow, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { DatabaseService } from './services/DatabaseService'
import { NetworkMonitor } from './services/NetworkMonitor'
import { SyncService } from './services/SyncService'
import { SecureStorage } from './services/SecureStorage'
import './ipc/handlers'

let mainWindow: BrowserWindow | null = null
let databaseService: DatabaseService
let networkMonitor: NetworkMonitor
let syncService: SyncService

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    icon: icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Show window when ready or after timeout (failsafe)
  const showTimeout = setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      console.log('Forcing window show after timeout')
      mainWindow.show()
    }
  }, 5000)

  mainWindow.on('ready-to-show', () => {
    clearTimeout(showTimeout)
    mainWindow?.show()
  })

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Initialize services
async function initializeServices(): Promise<void> {
  // Initialize database
  databaseService = DatabaseService.getInstance()
  await databaseService.initialize()
  console.log('Database initialized')

  // Initialize network monitor
  networkMonitor = NetworkMonitor.getInstance()
  networkMonitor.startMonitoring()
  console.log('Network monitor started')

  // Initialize sync service
  const apiSettings = SecureStorage.getApiSettings()
  if (apiSettings) {
    syncService = SyncService.getInstance()
    syncService.setApiConfig(apiSettings.apiUrl, apiSettings.apiToken)
    
    // Listen for network changes
    networkMonitor.on('online', () => {
      console.log('Network online - triggering sync')
      syncService.syncAll()
      mainWindow?.webContents.send('network-status', true)
    })
    
    networkMonitor.on('offline', () => {
      console.log('Network offline')
      mainWindow?.webContents.send('network-status', false)
    })
  }
}

app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('my.gov.psoh.offline')

  // Default open or close DevTools by F12 in development
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Create window first so user sees the app
  createWindow()

  // Initialize services after window is created (non-blocking)
  try {
    await initializeServices()
  } catch (error) {
    console.error('Failed to initialize services:', error)
    dialog.showErrorBox(
      'Initialization Error',
      `Failed to initialize application services: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Cleanup on quit
app.on('before-quit', () => {
  networkMonitor?.stopMonitoring()
  databaseService?.close()
})

// Export for IPC handlers
export { mainWindow, databaseService, networkMonitor, syncService }
