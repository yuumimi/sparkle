import React, { useState } from 'react'
import SettingCard from '../base/base-setting-card'
import SettingItem from '../base/base-setting-item'
import { Button, Input, Select, SelectItem, Switch, Tooltip } from '@heroui/react'
import { BiCopy } from 'react-icons/bi'
import useSWR from 'swr'
import {
  checkAutoRun,
  copyEnv,
  disableAutoRun,
  enableAutoRun,
  startNetworkDetection,
  stopNetworkDetection
} from '@renderer/utils/ipc'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { platform } from '@renderer/utils/init'
import { IoIosHelpCircle } from 'react-icons/io'
import EditableList from '../base/base-list-editor'

const GeneralConfig: React.FC = () => {
  const { data: enable, mutate: mutateEnable } = useSWR('checkAutoRun', checkAutoRun)
  const { appConfig, patchAppConfig } = useAppConfig()
  const {
    silentStart = false,
    autoQuitWithoutCore = false,
    autoQuitWithoutCoreDelay = 60,
    envType = [platform === 'win32' ? 'powershell' : 'bash'],
    autoCheckUpdate,
    updateChannel = 'stable',
    networkDetection = false,
    networkDetectionBypass = ['VMware', 'vEthernet'],
    networkDetectionInterval = 10
  } = appConfig || {}

  const [bypass, setBypass] = useState(networkDetectionBypass)
  const [interval, setInterval] = useState(networkDetectionInterval)

  return (
    <>
      <SettingCard>
        <SettingItem title="开机自启" divider>
          <Switch
            size="sm"
            isSelected={enable}
            onValueChange={async (v) => {
              try {
                if (v) {
                  await enableAutoRun()
                } else {
                  await disableAutoRun()
                }
              } catch (e) {
                alert(e)
              } finally {
                mutateEnable()
              }
            }}
          />
        </SettingItem>
        <SettingItem title="静默启动" divider>
          <Switch
            size="sm"
            isSelected={silentStart}
            onValueChange={(v) => {
              patchAppConfig({ silentStart: v })
            }}
          />
        </SettingItem>
        <SettingItem title="自动检查更新" divider>
          <Switch
            size="sm"
            isSelected={autoCheckUpdate}
            onValueChange={(v) => {
              patchAppConfig({ autoCheckUpdate: v })
            }}
          />
        </SettingItem>
        <SettingItem title="更新通道" divider>
          <Select
            classNames={{ trigger: 'data-[hover=true]:bg-default-200' }}
            className="w-[150px]"
            size="sm"
            disallowEmptySelection={true}
            selectedKeys={new Set([updateChannel])}
            onSelectionChange={async (v) => {
              patchAppConfig({ updateChannel: v.currentKey as 'stable' | 'beta' })
            }}
          >
            <SelectItem key="stable">正式版</SelectItem>
            <SelectItem key="beta">测试版</SelectItem>
          </Select>
        </SettingItem>
        <SettingItem
          title="自动开启轻量模式"
          actions={
            <Tooltip content="关闭窗口指定时间后自动进入轻量模式">
              <Button isIconOnly size="sm" variant="light">
                <IoIosHelpCircle className="text-lg" />
              </Button>
            </Tooltip>
          }
          divider
        >
          <Switch
            size="sm"
            isSelected={autoQuitWithoutCore}
            onValueChange={(v) => {
              patchAppConfig({ autoQuitWithoutCore: v })
            }}
          />
        </SettingItem>
        {autoQuitWithoutCore && (
          <SettingItem title="自动开启轻量模式延时" divider>
            <Input
              size="sm"
              className="w-[100px]"
              type="number"
              endContent="秒"
              value={autoQuitWithoutCoreDelay.toString()}
              onValueChange={async (v: string) => {
                let num = parseInt(v)
                if (isNaN(num)) num = 5
                if (num < 5) num = 5
                await patchAppConfig({ autoQuitWithoutCoreDelay: num })
              }}
            />
          </SettingItem>
        )}
        <SettingItem
          title="复制环境变量类型"
          actions={envType.map((type) => (
            <Button
              key={type}
              title={type}
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => copyEnv(type)}
            >
              <BiCopy className="text-lg" />
            </Button>
          ))}
          divider
        >
          <Select
            classNames={{ trigger: 'data-[hover=true]:bg-default-200' }}
            className="w-[150px]"
            size="sm"
            selectionMode="multiple"
            selectedKeys={new Set(envType)}
            disallowEmptySelection={true}
            onSelectionChange={async (v) => {
              try {
                await patchAppConfig({
                  envType: Array.from(v) as ('bash' | 'cmd' | 'powershell')[]
                })
              } catch (e) {
                alert(e)
              }
            }}
          >
            <SelectItem key="bash">Bash</SelectItem>
            <SelectItem key="cmd">CMD</SelectItem>
            <SelectItem key="powershell">PowerShell</SelectItem>
            <SelectItem key="nushell">NuShell</SelectItem>
          </Select>
        </SettingItem>
        <SettingItem
          title="断网时停止内核"
          actions={
            <Tooltip content="开启后，应用会在检测到网络断开时自动停止内核，并在网络恢复后自动重启内核">
              <Button isIconOnly size="sm" variant="light">
                <IoIosHelpCircle className="text-lg" />
              </Button>
            </Tooltip>
          }
          divider={networkDetection}
        >
          <Switch
            size="sm"
            isSelected={networkDetection}
            onValueChange={(v) => {
              patchAppConfig({ networkDetection: v })
              if (v) {
                startNetworkDetection()
              } else {
                stopNetworkDetection()
              }
            }}
          />
        </SettingItem>
        {networkDetection && (
          <>
            <SettingItem
              title="断网检测间隔"
              actions={
                <Tooltip content="设置断网检测的间隔时间，单位为秒">
                  <Button isIconOnly size="sm" variant="light">
                    <IoIosHelpCircle className="text-lg" />
                  </Button>
                </Tooltip>
              }
              divider
            >
              <div className="flex">
                {interval !== networkDetectionInterval && (
                  <Button
                    size="sm"
                    color="primary"
                    className="mr-2"
                    onPress={async () => {
                      await patchAppConfig({ networkDetectionInterval: interval })
                      await startNetworkDetection()
                    }}
                  >
                    确认
                  </Button>
                )}
                <Input
                  size="sm"
                  type="number"
                  className="w-[100px]"
                  value={interval.toString()}
                  min={1}
                  onValueChange={(v) => {
                    setInterval(parseInt(v))
                  }}
                />
              </div>
            </SettingItem>
            <SettingItem title="绕过检测的接口">
              {bypass.length != networkDetectionBypass.length && (
                <Button
                  size="sm"
                  color="primary"
                  onPress={async () => {
                    await patchAppConfig({ networkDetectionBypass: bypass })
                    await startNetworkDetection()
                  }}
                >
                  确认
                </Button>
              )}
            </SettingItem>
            <EditableList items={bypass} onChange={(list) => setBypass(list)} divider={false} />
          </>
        )}
      </SettingCard>
    </>
  )
}

export default GeneralConfig
