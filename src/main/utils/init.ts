import {
  appConfigPath,
  controledMihomoConfigPath,
  dataDir,
  logDir,
  mihomoTestDir,
  mihomoWorkDir,
  overrideConfigPath,
  overrideDir,
  profileConfigPath,
  profilePath,
  profilesDir,
  resourcesFilesDir,
  subStoreDir,
  themesDir
} from './dirs'
import {
  defaultConfig,
  defaultControledMihomoConfig,
  defaultOverrideConfig,
  defaultProfile,
  defaultProfileConfig
} from './template'
import { stringifyYaml } from './yaml'
import { mkdir, writeFile, cp, rm, readdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import {
  startPacServer,
  startSubStoreBackendServer,
  startSubStoreFrontendServer
} from '../resolve/server'
import { isHelperInstalled, triggerSysProxy } from '../sys/sysproxy'
import {
  getAppConfig,
  getControledMihomoConfig,
  patchAppConfig,
  patchControledMihomoConfig
} from '../config'
import { app } from 'electron'
import { startSSIDCheck } from '../sys/ssid'
import { startNetworkDetection } from '../core/manager'

async function initDirs(): Promise<void> {
  if (!existsSync(dataDir())) {
    await mkdir(dataDir())
  }
  if (!existsSync(themesDir())) {
    await mkdir(themesDir())
  }
  if (!existsSync(profilesDir())) {
    await mkdir(profilesDir())
  }
  if (!existsSync(overrideDir())) {
    await mkdir(overrideDir())
  }
  if (!existsSync(mihomoWorkDir())) {
    await mkdir(mihomoWorkDir())
  }
  if (!existsSync(logDir())) {
    await mkdir(logDir())
  }
  if (!existsSync(mihomoTestDir())) {
    await mkdir(mihomoTestDir())
  }
  if (!existsSync(subStoreDir())) {
    await mkdir(subStoreDir())
  }
}

async function initConfig(): Promise<void> {
  if (!existsSync(appConfigPath())) {
    await writeFile(appConfigPath(), stringifyYaml(defaultConfig))
  }
  if (!existsSync(profileConfigPath())) {
    await writeFile(profileConfigPath(), stringifyYaml(defaultProfileConfig))
  }
  if (!existsSync(overrideConfigPath())) {
    await writeFile(overrideConfigPath(), stringifyYaml(defaultOverrideConfig))
  }
  if (!existsSync(profilePath('default'))) {
    await writeFile(profilePath('default'), stringifyYaml(defaultProfile))
  }
  if (!existsSync(controledMihomoConfigPath())) {
    await writeFile(controledMihomoConfigPath(), stringifyYaml(defaultControledMihomoConfig))
  }
}

async function initFiles(): Promise<void> {
  const copy = async (file: string): Promise<void> => {
    const targetPath = path.join(mihomoWorkDir(), file)
    const testTargetPath = path.join(mihomoTestDir(), file)
    const sourcePath = path.join(resourcesFilesDir(), file)
    if (!existsSync(targetPath) && existsSync(sourcePath)) {
      await cp(sourcePath, targetPath, { recursive: true })
    }
    if (!existsSync(testTargetPath) && existsSync(sourcePath)) {
      await cp(sourcePath, testTargetPath, { recursive: true })
    }
  }
  await Promise.all([
    copy('country.mmdb'),
    copy('geoip.metadb'),
    copy('geoip.dat'),
    copy('geosite.dat'),
    copy('ASN.mmdb'),
    copy('sub-store.bundle.js'),
    copy('sub-store-frontend')
  ])
}

async function cleanup(): Promise<void> {
  // update cache
  const files = await readdir(dataDir())
  for (const file of files) {
    if (file.endsWith('.exe') || file.endsWith('.pkg') || file.endsWith('.7z')) {
      try {
        await rm(path.join(dataDir(), file))
      } catch {
        // ignore
      }
    }
  }
  // logs
  const { maxLogDays = 7 } = await getAppConfig()
  const logs = await readdir(logDir())
  for (const log of logs) {
    const date = new Date(log.split('.')[0])
    const diff = Date.now() - date.getTime()
    if (diff > maxLogDays * 24 * 60 * 60 * 1000) {
      try {
        await rm(path.join(logDir(), log))
      } catch {
        // ignore
      }
    }
  }
}

async function migration(): Promise<void> {
  const {
    siderOrder = [
      'sysproxy',
      'tun',
      'profile',
      'proxy',
      'rule',
      'resource',
      'override',
      'connection',
      'mihomo',
      'dns',
      'sniff',
      'log',
      'substore'
    ],
    appTheme = 'system',
    envType = [process.platform === 'win32' ? 'powershell' : 'bash'],
    useSubStore = true,
    showFloatingWindow = false,
    disableTray = false,
    encryptedPassword,
    hosts = []
  } = await getAppConfig()
  const {
    'external-controller-pipe': externalControllerPipe,
    'external-controller-unix': externalControllerUnix,
    'external-controller': externalController,
    'skip-auth-prefixes': skipAuthPrefixes,
    authentication,
    'bind-address': bindAddress,
    'lan-allowed-ips': lanAllowedIps,
    'lan-disallowed-ips': lanDisallowedIps
  } = await getControledMihomoConfig()
  // add substore sider card
  if (useSubStore && !siderOrder.includes('substore')) {
    await patchAppConfig({ siderOrder: [...siderOrder, 'substore'] })
  }
  // add default skip auth prefix
  if (!skipAuthPrefixes) {
    await patchControledMihomoConfig({ 'skip-auth-prefixes': ['127.0.0.1/32'] })
  }
  // add default authentication
  if (!authentication) {
    await patchControledMihomoConfig({ authentication: [] })
  }
  // add default bind address
  if (!bindAddress) {
    await patchControledMihomoConfig({ 'bind-address': '*' })
  }
  // add default lan allowed ips
  if (!lanAllowedIps) {
    await patchControledMihomoConfig({ 'lan-allowed-ips': ['0.0.0.0/0', '::/0'] })
  }
  // add default lan disallowed ips
  if (!lanDisallowedIps) {
    await patchControledMihomoConfig({ 'lan-disallowed-ips': [] })
  }
  // add default hosts
  if (!hosts.length) {
    await patchAppConfig({ hosts: [] })
  }
  // remove custom app theme
  if (!['system', 'light', 'dark'].includes(appTheme)) {
    await patchAppConfig({ appTheme: 'system' })
  }
  // change env type
  if (typeof envType === 'string') {
    await patchAppConfig({ envType: [envType] })
  }
  // use unix socket
  if (externalControllerUnix) {
    await patchControledMihomoConfig({ 'external-controller-unix': undefined })
  }
  // use named pipe
  if (externalControllerPipe) {
    await patchControledMihomoConfig({
      'external-controller-pipe': undefined
    })
  }
  if (externalController === undefined) {
    await patchControledMihomoConfig({ 'external-controller': '' })
  }
  if (!showFloatingWindow && disableTray) {
    await patchAppConfig({ disableTray: false })
  }
  // remove password
  if (encryptedPassword) {
    await patchAppConfig({ encryptedPassword: undefined })
  }
}

function initDeeplink(): void {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('clash', process.execPath, [path.resolve(process.argv[1])])
      app.setAsDefaultProtocolClient('mihomo', process.execPath, [path.resolve(process.argv[1])])
      app.setAsDefaultProtocolClient('sparkle', process.execPath, [path.resolve(process.argv[1])])
    }
  } else {
    app.setAsDefaultProtocolClient('clash')
    app.setAsDefaultProtocolClient('mihomo')
    app.setAsDefaultProtocolClient('sparkle')
  }
}

export async function init(): Promise<void> {
  await initDirs()
  await initConfig()
  await migration()
  await initFiles()
  await cleanup()
  await startSubStoreFrontendServer()
  await startSubStoreBackendServer()
  const { sysProxy, onlyActiveDevice = false, networkDetection = false, autoEnableSysProxy = true } = await getAppConfig()
  if (networkDetection) {
    await startNetworkDetection()
  }
  try {
    if (!(await isHelperInstalled())) {
      await patchAppConfig({ sysProxy: { enable: false } })
    } else {
      const shouldAutoEnable = autoEnableSysProxy !== false
      const shouldEnable = shouldAutoEnable ? true : Boolean(sysProxy.enable)
      if (shouldEnable) {
        await startPacServer()
      }
      if (shouldAutoEnable && !sysProxy.enable) {
        await patchAppConfig({ sysProxy: { ...sysProxy, enable: true } })
      }
      await triggerSysProxy(shouldEnable, onlyActiveDevice)
    }
  } catch {
    // ignore
  }
  await startSSIDCheck()

  initDeeplink()
}
