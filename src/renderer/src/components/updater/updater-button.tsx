import { Button } from '@heroui/react'
import React, { useState } from 'react'
import UpdaterModal from './updater-modal'
import { GrUpgrade } from 'react-icons/gr'

interface Props {
  iconOnly?: boolean
  latest?: {
    version: string
    changelog: string
  }
}

const UpdaterButton: React.FC<Props> = (props) => {
  const { iconOnly, latest } = props
  const [openModal, setOpenModal] = useState(false)

  if (!latest) return null

  return (
    <>
      {openModal && (
        <UpdaterModal
          version={latest.version}
          changelog={latest.changelog}
          onClose={() => {
            setOpenModal(false)
          }}
        />
      )}
      {iconOnly ? (
        <Button
          isIconOnly
          className={`app-nodrag`}
          color="danger"
          size="md"
          onPress={() => {
            setOpenModal(true)
          }}
        >
          <GrUpgrade />
        </Button>
      ) : (
        <Button
          isIconOnly
          className={`fixed right-[45px] app-nodrag`}
          color="danger"
          size="sm"
          onPress={() => {
            setOpenModal(true)
          }}
        >
          <GrUpgrade />
        </Button>
      )}
    </>
  )
}

export default UpdaterButton
