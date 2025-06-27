import fs from 'fs'
import path from 'path'
import plist from 'plist'
import { findBestAppPath, isIOSApp } from './image'

export async function getAppName(appPath: string): Promise<string> {
  if (process.platform === 'darwin') {
    try {
      const targetPath = findBestAppPath(appPath)
      if (!targetPath) return ''

      if (isIOSApp(targetPath)) {
        const plistPath = path.join(targetPath, 'Info.plist')
        const xml = fs.readFileSync(plistPath, 'utf-8')
        const parsed = plist.parse(xml) as Record<string, unknown>
        return (parsed.CFBundleDisplayName as string) || (parsed.CFBundleName as string) || ''
      }

      const langDir = path.join(targetPath, 'Contents', 'Resources', 'zh-Hans.lproj')
      const stringsPath = path.join(langDir, 'InfoPlist.strings')
      if (fs.existsSync(stringsPath)) {
        try {
          const buf = fs.readFileSync(stringsPath)
          const content = buf.toString('utf16le')
          const lines = content.split('\n')
          const localized: Record<string, string> = {}

          for (const line of lines) {
            const trimmed = line.trim()
            if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*')) {
              const match = trimmed.match(/^"([^"]+)"\s*=\s*"([^"]+)";?$/)
              if (match) {
                localized[match[1]] = match[2]
              }
            }
          }

          if (localized.CFBundleDisplayName) {
            return localized.CFBundleDisplayName
          }
          if (localized.CFBundleName) {
            return localized.CFBundleName
          }
        } catch (e) {
          // ignore
        }
      }

      const plistPath = path.join(targetPath, 'Contents', 'Info.plist')
      if (fs.existsSync(plistPath)) {
        const xml = fs.readFileSync(plistPath, 'utf-8')
        const parsed = plist.parse(xml) as Record<string, unknown>

        return (parsed.CFBundleDisplayName as string) || (parsed.CFBundleName as string) || ''
      } else {
        // ignore
      }
    } catch (err) {
      // ignore
    }
  }
  return ''
}
