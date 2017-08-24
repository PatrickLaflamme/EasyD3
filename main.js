const electron = require("electron")
const {app, BrowserWindow} = electron

app.on("ready", () => {
  let win = new BrowserWindow({width: 800,
                              height: 600,
                              backgrounColor: "#00BCE4",
                              show: false,
                              titleBarStyle: 'hidden'})
  win.maximize()
  win.loadURL(`file://${__dirname}/app/index.html`)

  win.once('ready-to-show', () => {
    win.show()
  })

  win.on("closed", () => {app.quit();})

});
