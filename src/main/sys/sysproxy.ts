import { getAppConfig, getControledMihomoConfig } from '../config'
import { pacPort, startPacServer, stopPacServer } from '../resolve/server'
import { promisify } from 'util'
import { execFile } from 'child_process'
import { sysproxyPath } from '../utils/dirs'
import { net } from 'electron'
import axios from 'axios'

let defaultBypass: string[]
let triggerSysProxyTimer: NodeJS.Timeout | null = null
const helperSocketPath = '/tmp/sparkle-helper.sock'

export async function triggerSysProxy(enable: boolean): Promise<void> {
  if (net.isOnline()) {
    if (enable) {
      await setSysProxy()
    } else {
      await disableSysProxy()
    }
  } else {
    if (triggerSysProxyTimer) clearTimeout(triggerSysProxyTimer)
    triggerSysProxyTimer = setTimeout(() => triggerSysProxy(enable), 5000)
  }
}

async function setSysProxy(): Promise<void> {
  if (process.platform === 'linux')
    defaultBypass = [
      'localhost',
      '.local',
      '127.0.0.1/8',
      '192.168.0.0/16',
      '10.0.0.0/8',
      '172.16.0.0/12',
      '::1'
    ]
  if (process.platform === 'darwin')
    defaultBypass = [
      '127.0.0.1/8',
      '192.168.0.0/16',
      '10.0.0.0/8',
      '172.16.0.0/12',
      'localhost',
      '*.local',
      '*.crashlytics.com',
      '<local>'
    ]
  if (process.platform === 'win32')
    defaultBypass = [
      'localhost',
      '127.*',
      '192.168.*',
      '10.*',
      '172.16.*',
      '172.17.*',
      '172.18.*',
      '172.19.*',
      '172.20.*',
      '172.21.*',
      '172.22.*',
      '172.23.*',
      '172.24.*',
      '172.25.*',
      '172.26.*',
      '172.27.*',
      '172.28.*',
      '172.29.*',
      '172.30.*',
      '172.31.*',
      '<local>'
    ]
  await startPacServer()
  const { sysProxy } = await getAppConfig()
  const { mode, host, bypass = defaultBypass } = sysProxy
  const { 'mixed-port': port = 7890 } = await getControledMihomoConfig()
  const execFilePromise = promisify(execFile)
  switch (mode || 'manual') {
    case 'auto': {
      if (process.platform === 'darwin') {
        await axios.post(
          'http://localhost/pac',
          { url: `http://${host || '127.0.0.1'}:${pacPort}/pac` },
          {
            socketPath: helperSocketPath
          }
        )
      } else {
        await execFilePromise(sysproxyPath(), [
          'pac',
          '--url',
          `http://${host || '127.0.0.1'}:${pacPort}/pac`
        ])
      }
      break
    }

    case 'manual': {
      if (port != 0) {
        if (process.platform === 'darwin') {
          await axios.post(
            'http://localhost/proxy',
            { server: `${host || '127.0.0.1'}:${port}`, bypass: bypass.join(',') },
            {
              socketPath: helperSocketPath
            }
          )
        } else {
          await execFilePromise(sysproxyPath(), [
            'proxy',
            '--server',
            `${host || '127.0.0.1'}:${port}`,
            '--bypass',
            bypass.join(';')
          ])
        }
      }
      break
    }
  }
}

async function disableSysProxy(): Promise<void> {
  await stopPacServer()
  const execFilePromise = promisify(execFile)
  if (process.platform === 'darwin') {
    await axios.post(
      'http://localhost/disable',
      {},
      {
        socketPath: helperSocketPath
      }
    )
  } else {
    await execFilePromise(sysproxyPath(), ['disable'])
  }
}
