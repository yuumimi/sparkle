import React, { useState } from 'react'
import SettingCard from '../base/base-setting-card'
import SettingItem from '../base/base-setting-item'
import { Button, Divider, Switch } from '@heroui/react'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { restartCore } from '@renderer/utils/ipc'
import EditableList from '../base/base-list-editor'

const EnvSetting: React.FC = () => {
  const { appConfig, patchAppConfig } = useAppConfig()
  const { disableLoopbackDetector, skipSafePathCheck, safePaths = [] } = appConfig || {}
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
  const [safePathsInput, setSafePathsInput] = useState(safePaths)

  return (
    <SettingCard title="环境变量">
      <SettingItem title="禁用回环检测器" divider>
        <Switch
          size="sm"
          isSelected={disableLoopbackDetector}
          onValueChange={(v) => {
            handleConfigChangeWithRestart('disableLoopbackDetector', v)
          }}
        />
      </SettingItem>
      <SettingItem title="禁用可信路径检查">
        <Switch
          size="sm"
          isSelected={skipSafePathCheck}
          onValueChange={(v) => {
            handleConfigChangeWithRestart('skipSafePathCheck', v)
          }}
        />
      </SettingItem>
      {!skipSafePathCheck && (
        <>
          <Divider className="mt-2 mb-2" />
          <SettingItem title="可信路径">
            {safePathsInput.join('') != safePaths.join('') && (
              <Button
                size="sm"
                color="primary"
                onPress={() => {
                  handleConfigChangeWithRestart('safePaths', safePathsInput)
                }}
              >
                确认
              </Button>
            )}
          </SettingItem>
          <EditableList items={safePathsInput} onChange={setSafePathsInput} divider={false} />
        </>
      )}
    </SettingCard>
  )
}

export default EnvSetting
