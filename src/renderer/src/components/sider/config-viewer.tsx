import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Switch
} from '@heroui/react'
import React, { useEffect, useState, useCallback } from 'react'
import { BaseEditor } from '../base/base-editor'
import { getProfileConfig, getProfileParseStr, getRuntimeConfigStr } from '@renderer/utils/ipc'
import useSWR from 'swr'

interface Props {
  onClose: () => void
}
const ConfigViewer: React.FC<Props> = ({ onClose }) => {
  const [runtimeConfig, setRuntimeConfig] = useState('')
  const [profileConfig, setProfileConfig] = useState('')
  const [isDiff, setIsDiff] = useState(false)
  const [sideBySide, setSideBySide] = useState(false)

  const { data: appConfig } = useSWR('getProfileConfig', getProfileConfig)

  const fetchConfigs = useCallback(async () => {
    const runtime = await getRuntimeConfigStr()
    setRuntimeConfig(runtime)

    if (appConfig?.current) {
      const profile = await getProfileParseStr(appConfig.current)
      setProfileConfig(profile)
    }
  }, [appConfig])

  useEffect(() => {
    fetchConfigs()
  }, [fetchConfigs])

  return (
    <Modal
      backdrop="blur"
      classNames={{ backdrop: 'top-[48px]' }}
      size="5xl"
      hideCloseButton
      isOpen={true}
      onOpenChange={onClose}
      scrollBehavior="inside"
    >
      <ModalContent className="h-full w-[calc(100%-100px)]">
        <ModalHeader className="flex pb-0 app-drag">当前运行时配置</ModalHeader>
        <ModalBody className="h-full">
          <BaseEditor
            language="yaml"
            value={runtimeConfig}
            originalValue={isDiff ? profileConfig : undefined}
            readOnly
            diffRenderSideBySide={sideBySide}
          />
        </ModalBody>
        <ModalFooter className="pt-0 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch size="sm" isSelected={isDiff} onValueChange={setIsDiff} />
            <span className="text-sm">对比当前配置</span>
            <Switch size="sm" isSelected={sideBySide} onValueChange={setSideBySide} />
            <span className="text-sm">侧边显示</span>
          </div>
          <Button size="sm" variant="light" onPress={onClose}>
            关闭
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default ConfigViewer
