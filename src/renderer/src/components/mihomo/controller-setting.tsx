import React, { useState } from 'react'
import SettingCard from '../base/base-setting-card'
import SettingItem from '../base/base-setting-item'
import { Button, Input, Switch } from '@heroui/react'
import { restartCore } from '@renderer/utils/ipc'
import { useControledMihomoConfig } from '@renderer/hooks/use-controled-mihomo-config'
import EditableList from '../base/base-list-editor'

const ControllerSetting: React.FC = () => {
  const { controledMihomoConfig, patchControledMihomoConfig } = useControledMihomoConfig()
  const {
    'external-controller': externalController = '',
    'external-controller-cors': externalControllerCors,
    secret
  } = controledMihomoConfig || {}
  const {
    'allow-origins': allowOrigins = [],
    'allow-private-network': allowPrivateNetwork = true
  } = externalControllerCors || {}

  const initialAllowOrigins = allowOrigins.length == 1 && allowOrigins[0] == '*' ? [] : allowOrigins
  const [allowOriginsInput, setAllowOriginsInput] = useState(initialAllowOrigins)
  const [externalControllerInput, setExternalControllerInput] = useState(externalController)
  const [secretInput, setSecretInput] = useState(secret)

  const onChangeNeedRestart = async (patch: Partial<IMihomoConfig>): Promise<void> => {
    await patchControledMihomoConfig(patch)
    await restartCore()
  }

  return (
    <SettingCard title="外部控制器">
      <SettingItem title="监听地址" divider>
        <div className="flex">
          {externalControllerInput != externalController && (
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
            onValueChange={setExternalControllerInput}
          />
        </div>
      </SettingItem>
      <SettingItem title="访问密钥" divider>
        <div className="flex">
          {secretInput != secret && (
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
            onValueChange={setSecretInput}
          />
        </div>
      </SettingItem>
      <SettingItem title="CORS 配置"></SettingItem>
      <div className="flex flex-col space-y-2 mt-2"></div>
      <SettingItem title="允许私有网络访问">
        <Switch
          size="sm"
          isSelected={allowPrivateNetwork}
          onValueChange={(v) => {
            onChangeNeedRestart({
              'external-controller-cors': {
                ...externalControllerCors,
                'allow-private-network': v
              }
            })
          }}
        />
      </SettingItem>
      <div className="mt-1"></div>
      <SettingItem title="允许的来源">
        {allowOriginsInput.join(',') != initialAllowOrigins.join(',') && (
          <Button
            size="sm"
            color="primary"
            onPress={() => {
              const finalOrigins = allowOriginsInput.length == 0 ? ['*'] : allowOriginsInput
              onChangeNeedRestart({
                'external-controller-cors': {
                  ...externalControllerCors,
                  'allow-origins': finalOrigins
                }
              })
            }}
          >
            确认
          </Button>
        )}
      </SettingItem>
      <EditableList items={allowOriginsInput} onChange={setAllowOriginsInput} divider={false} />
    </SettingCard>
  )
}

export default ControllerSetting
