const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow () {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true // ซ่อนเมนูด้านบนของหน้าต่างให้ดูเป็นแอปเต็มตัว
  })

  // โหลดหน้าเว็บที่ Build แล้วจากโฟลเดอร์ dist
  win.loadURL(`file://${path.join(__dirname, 'dist/index.html')}`)
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})