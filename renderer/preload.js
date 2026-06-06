// preload.js — safe bridge between renderer and main
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  addEntry:   (item)    => ipcRenderer.send("add-entry", item),
  getAll:     ()        => ipcRenderer.invoke("get-all"),
  saveEntry:  (updated) => ipcRenderer.invoke("save-entry", updated),
  deleteEntry:(id)      => ipcRenderer.invoke("delete-entry", id),
});
