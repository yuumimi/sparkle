import axios from 'axios'
import { getControledMihomoConfig } from '../config'
import fs from 'fs'
import path from 'path'
import fii from 'file-icon-info'
import { windowsDefaultIcon, darwinDefaultIcon } from './defaultIcon'

export async function getImageDataURL(url: string): Promise<string> {
  const { 'mixed-port': port = 7890 } = await getControledMihomoConfig()
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    ...(port != 0 && {
      proxy: {
        protocol: 'http',
        host: '127.0.0.1',
        port
      }
    })
  })
  const mimeType = res.headers['content-type']
  const dataURL = `data:${mimeType};base64,${Buffer.from(res.data).toString('base64')}`
  return dataURL
}

function isIOSApp(appPath: string): boolean {
  const appDir = appPath.endsWith('.app')
    ? appPath
    : appPath.includes('.app')
      ? appPath.substring(0, appPath.indexOf('.app') + 4)
      : path.dirname(appPath)

  return !fs.existsSync(path.join(appDir, 'Contents'))
}

function hasIOSAppIcon(appPath: string): boolean {
  try {
    const items = fs.readdirSync(appPath)
    return items.some((item) => {
      const lower = item.toLowerCase()
      const ext = path.extname(item).toLowerCase()
      return lower.startsWith('appicon') && (ext === '.png' || ext === '.jpg' || ext === '.jpeg')
    })
  } catch {
    return false
  }
}

function hasMacOSAppIcon(appPath: string): boolean {
  const resourcesDir = path.join(appPath, 'Contents', 'Resources')
  if (!fs.existsSync(resourcesDir)) {
    return false
  }

  try {
    const items = fs.readdirSync(resourcesDir)
    return items.some((item) => path.extname(item).toLowerCase() === '.icns')
  } catch {
    return false
  }
}

function findBestAppPath(appPath: string): string | null {
  if (!appPath.includes('.app')) {
    return null
  }

  const parts = appPath.split(path.sep)
  const appPaths: string[] = []

  for (let i = 0; i < parts.length; i++) {
    if (parts[i].endsWith('.app')) {
      const fullPath = parts.slice(0, i + 1).join(path.sep)
      appPaths.push(fullPath)
    }
  }
  if (appPaths.length === 0) {
    return null
  }
  if (appPaths.length === 1) {
    return appPaths[0]
  }
  for (let i = appPaths.length - 1; i >= 0; i--) {
    const appDir = appPaths[i]
    if (isIOSApp(appDir)) {
      if (hasIOSAppIcon(appDir)) {
        return appDir
      }
    } else {
      if (hasMacOSAppIcon(appDir)) {
        return appDir
      }
    }
  }
  return appPaths[0]
}

export async function getIconDataURL(appPath: string): Promise<string> {
  if (!appPath) {
    return ''
  }

  if (process.platform === 'win32') {
    if (fs.existsSync(appPath) && /\.(exe|dll)$/i.test(appPath)) {
      try {
        const base64: string = await new Promise((resolve) => {
          fii.getIcon(appPath, (b64: string) => {
            resolve(b64)
          })
        })
        return `data:image/png;base64,${base64}`
      } catch {
        return windowsDefaultIcon
      }
    }
    return windowsDefaultIcon
  }

  if (process.platform === 'darwin') {
    if (!appPath.includes('.app')) {
      return darwinDefaultIcon
    }
    const { fileIconToBuffer } = await import('file-icon')
    const targetPath = findBestAppPath(appPath)
    if (!targetPath) {
      return darwinDefaultIcon
    }
    const iconBuffer = await fileIconToBuffer(targetPath)
    const base64Icon = iconBuffer.toString('base64')
    return `data:image/png;base64,${base64Icon}`
  }

  return ''
}
