import { useEffect, useState } from "react"
import yaml from 'js-yaml'
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react"
import { BaseEditor } from "../base/base-editor"

interface Props {
  bypass: string[]
  onCancel: () => void
  onConfirm: (bypass: string[]) => void
}

const ByPassEditorModal: React.FC<Props> = ({ bypass, onCancel, onConfirm }) => {
  const [currData, setCurrData] = useState<string>('')
  useEffect(() => {
    setCurrData(yaml.dump({ bypass }))
  }, [bypass])
  const handleConfirm = () => {
    try {
      const parsed = yaml.load(currData)
      if (parsed && Array.isArray(parsed.bypass)) {
        onConfirm(parsed.bypass)
      } else {
        alert('YAML 格式错误')
      }
    } catch (e) {
      alert('YAML 解析失败: ' + e)
    }
  }

  return (
    <Modal
      backdrop="blur"
      classNames={{
        base: 'max-w-none w-full',
        backdrop: 'top-[48px]'
      }}
      size="5xl"
      hideCloseButton
      isOpen={true}
      onOpenChange={onCancel}
      scrollBehavior="inside"
    >
      <ModalContent className="h-full w-[calc(100%-100px)]">
        <ModalHeader className="flex pb-0 app-drag">编辑绕过列表 (YAML)</ModalHeader>
        <ModalBody className="h-full">
          <BaseEditor
            language="yaml"
            value={currData}
            onChange={(value) => setCurrData(value || '')}
          />
        </ModalBody>
        <ModalFooter className="pt-0">
          <Button size="sm" variant="light" onPress={onCancel}>
            取消
          </Button>
          <Button size="sm" color="primary" onPress={handleConfirm}>
            确认
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default ByPassEditorModal