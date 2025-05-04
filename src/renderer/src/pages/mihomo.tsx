import { Button, Divider, Input, Select, SelectItem, Switch } from '@heroui/react'
import BasePage from '@renderer/components/base/base-page'
import SettingCard from '@renderer/components/base/base-setting-card'
import SettingItem from '@renderer/components/base/base-setting-item'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { useControledMihomoConfig } from '@renderer/hooks/use-controled-mihomo-config'
import PortSetting from '@renderer/components/mihomo/port-setting'
import { platform } from '@renderer/utils/init'
import { IoMdCloudDownload } from 'react-icons/io'
import PubSub from 'pubsub-js'
import { mihomoUpgrade, restartCore } from '@renderer/utils/ipc'
import React, { useState } from 'react'

const CoreMap = {
  mihomo: '稳定版',
  'mihomo-alpha': '预览版'
}

const Mihomo: React.FC = () => {
  const { appConfig, patchAppConfig } = useAppConfig()
  const {
    core = 'mihomo',
    maxLogDays = 7,
    disableLoopbackDetector,
    skipSafePathCheck
  } = appConfig || {}
  const { controledMihomoConfig, patchControledMihomoConfig } = useControledMihomoConfig()
  const {
    ipv6,
    'external-controller': externalController = '',
    secret,
    'log-level': logLevel = 'info',
    'find-process-mode': findProcessMode = 'strict',
    'unified-delay': unifiedDelay,
    'tcp-concurrent': tcpConcurrent,
    profile = {}
  } = controledMihomoConfig || {}
  const { 'store-selected': storeSelected, 'store-fake-ip': storeFakeIp } = profile

  const [externalControllerInput, setExternalControllerInput] = useState(externalController)
  const [secretInput, setSecretInput] = useState(secret)
  const [upgrading, setUpgrading] = useState(false)

  const onChangeNeedRestart = async (patch: Partial<IMihomoConfig>): Promise<void> => {
    await patchControledMihomoConfig(patch)
    await restartCore()
  }

  const handleConfigChangeWithRestart = async (key: string, value: any) => {
    try {
      await patchAppConfig({ [key]: value })
      await restartCore()
    } catch (e) {
      alert(e)
    } finally {
      PubSub.publish('mihomo-core-changed')
    }
  }

  return (
    <BasePage title="内核设置">
      <PortSetting />
      <SettingCard>
        <SettingItem
          title="内核版本"
          actions={
            <Button
              size="sm"
              isIconOnly
              title="升级内核"
              variant="light"
              isLoading={upgrading}
              onPress={async () => {
                try {
                  setUpgrading(true)
                  await mihomoUpgrade()
                  setTimeout(() => {
                    PubSub.publish('mihomo-core-changed')
                  }, 2000)
                  if (platform !== 'win32') {
                    new Notification('内核权限丢失', {
                      body: '内核升级成功，若要使用虚拟网卡（Tun），请到虚拟网卡页面重新手动授权内核'
                    })
                  }
                } catch (e) {
                  if (typeof e === 'string' && e.includes('already using latest version')) {
                    new Notification('已经是最新版本')
                  } else {
                    alert(e)
                  }
                } finally {
                  setUpgrading(false)
                }
              }}
            >
              <IoMdCloudDownload className="text-lg" />
            </Button>
          }
          divider
        >
          <Select
            classNames={{ trigger: 'data-[hover=true]:bg-default-200' }}
            className="w-[100px]"
            size="sm"
            selectedKeys={new Set([core])}
            disallowEmptySelection={true}
            onSelectionChange={async (v) => {
              handleConfigChangeWithRestart('core', v.currentKey as 'mihomo' | 'mihomo-alpha')
            }}
          >
            <SelectItem key="mihomo">{CoreMap['mihomo']}</SelectItem>
            <SelectItem key="mihomo-alpha">{CoreMap['mihomo-alpha']}</SelectItem>
          </Select>
        </SettingItem>

        <SettingItem title="外部控制地址" divider>
          <div className="flex">
            {externalControllerInput !== externalController && (
              <Button
                size="sm"
                color="primary"
                className="mr-2"
                onPress={() => {
                  onChangeNeedRestart({
                    'external-controller': externalControllerInput
                  })
                }}
              >
                确认
              </Button>
            )}

            <Input
              size="sm"
              className="w-[200px]"
              value={externalControllerInput}
              onValueChange={(v) => {
                setExternalControllerInput(v)
              }}
            />
          </div>
        </SettingItem>
        <SettingItem title="外部控制访问密钥" divider>
          <div className="flex">
            {secretInput !== secret && (
              <Button
                size="sm"
                color="primary"
                className="mr-2"
                onPress={() => {
                  onChangeNeedRestart({ secret: secretInput })
                }}
              >
                确认
              </Button>
            )}

            <Input
              size="sm"
              type="password"
              className="w-[200px]"
              value={secretInput}
              onValueChange={(v) => {
                setSecretInput(v)
              }}
            />
          </div>
        </SettingItem>
        <SettingItem title="IPv6" divider>
          <Switch
            size="sm"
            isSelected={ipv6}
            onValueChange={(v) => {
              onChangeNeedRestart({ ipv6: v })
            }}
          />
        </SettingItem>
        <Divider className="mb-2" />
        <SettingItem title="使用 RTT 延迟测试" divider>
          <Switch
            size="sm"
            isSelected={unifiedDelay}
            onValueChange={(v) => {
              onChangeNeedRestart({ 'unified-delay': v })
            }}
          />
        </SettingItem>
        <SettingItem title="TCP 并发" divider>
          <Switch
            size="sm"
            isSelected={tcpConcurrent}
            onValueChange={(v) => {
              onChangeNeedRestart({ 'tcp-concurrent': v })
            }}
          />
        </SettingItem>
        <SettingItem title="存储选择节点" divider>
          <Switch
            size="sm"
            isSelected={storeSelected}
            onValueChange={(v) => {
              onChangeNeedRestart({ profile: { 'store-selected': v } })
            }}
          />
        </SettingItem>
        <SettingItem title="存储 FakeIP" divider>
          <Switch
            size="sm"
            isSelected={storeFakeIp}
            onValueChange={(v) => {
              onChangeNeedRestart({ profile: { 'store-fake-ip': v } })
            }}
          />
        </SettingItem>
        <SettingItem title="禁用回环检测器" divider>
          <Switch
            size="sm"
            isSelected={disableLoopbackDetector}
            onValueChange={(v) => {
              handleConfigChangeWithRestart('disableLoopbackDetector', v)
            }}
          />
        </SettingItem>
        <SettingItem title="禁用安全路径检查" divider>
          <Switch
            size="sm"
            isSelected={skipSafePathCheck}
            onValueChange={(v) => {
              handleConfigChangeWithRestart('skipSafePathCheck', v)
            }}
          />
        </SettingItem>
        <SettingItem title="日志保留天数" divider>
          <Input
            size="sm"
            type="number"
            className="w-[100px]"
            value={maxLogDays.toString()}
            onValueChange={(v) => {
              patchAppConfig({ maxLogDays: parseInt(v) })
            }}
          />
        </SettingItem>
        <SettingItem title="日志等级" divider>
          <Select
            classNames={{ trigger: 'data-[hover=true]:bg-default-200' }}
            className="w-[100px]"
            size="sm"
            selectedKeys={new Set([logLevel])}
            disallowEmptySelection={true}
            onSelectionChange={(v) => {
              onChangeNeedRestart({ 'log-level': v.currentKey as LogLevel })
            }}
          >
            <SelectItem key="silent">静默</SelectItem>
            <SelectItem key="error">错误</SelectItem>
            <SelectItem key="warning">警告</SelectItem>
            <SelectItem key="info">信息</SelectItem>
            <SelectItem key="debug">调试</SelectItem>
          </Select>
        </SettingItem>
        <SettingItem title="查找进程">
          <Select
            classNames={{ trigger: 'data-[hover=true]:bg-default-200' }}
            className="w-[100px]"
            size="sm"
            selectedKeys={new Set([findProcessMode])}
            disallowEmptySelection={true}
            onSelectionChange={(v) => {
              onChangeNeedRestart({ 'find-process-mode': v.currentKey as FindProcessMode })
            }}
          >
            <SelectItem key="strict">自动</SelectItem>
            <SelectItem key="off">关闭</SelectItem>
            <SelectItem key="always">开启</SelectItem>
          </Select>
        </SettingItem>
      </SettingCard>
    </BasePage>
  )
}

export default Mihomo
