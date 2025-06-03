import { Avatar, Button, Card, CardFooter, CardHeader, Chip } from '@heroui/react'
import { calcTraffic } from '@renderer/utils/calc'
import dayjs from 'dayjs'
import React, { memo, useEffect } from 'react'
import { CgClose, CgTrash } from 'react-icons/cg'

interface Props {
  index: number
  info: IMihomoConnectionDetail
  displayIcon?: boolean
  iconUrl: string
  selected: IMihomoConnectionDetail | undefined
  setSelected: React.Dispatch<React.SetStateAction<IMihomoConnectionDetail | undefined>>
  setIsDetailModalOpen: React.Dispatch<React.SetStateAction<boolean>>
  close: (id: string) => void
}

const ConnectionItem: React.FC<Props> = memo((props) => {
  const { index, info, displayIcon, iconUrl, close, selected, setSelected, setIsDetailModalOpen } =
    props

  useEffect(() => {
    if (selected?.id === info.id) {
      setSelected(info)
    }
  }, [info])

  return (
    <div className={`px-2 pb-2 ${index === 0 ? 'pt-2' : ''}`} style={{ minHeight: 80 }}>
      <Card
        isPressable
        className="w-full"
        onPress={() => {
          setSelected(info)
          setIsDetailModalOpen(true)
        }}
      >
        <div className="w-full flex justify-between items-center">
          {displayIcon && (
            <div>
              <Avatar size="lg" radius="sm" src={iconUrl} className="bg-transparent ml-2" />
            </div>
          )}
          <div
            className={`w-full flex flex-col justify-start truncate relative ${displayIcon ? '-ml-2' : ''}`}
          >
            <CardHeader className="pb-0 gap-1 flex items-center pr-12 relative">
              <div className="ml-2 flex-1 text-ellipsis whitespace-nowrap overflow-hidden text-left">
                <span style={{ textAlign: 'left' }}>
                  {info.metadata.process || info.metadata.sourceIP}
                </span>
                {' → '}
                {info.metadata.host ||
                  info.metadata.sniffHost ||
                  info.metadata.destinationIP ||
                  info.metadata.remoteDestination}
              </div>
              <small className="ml-2 whitespace-nowrap text-foreground-500">
                {dayjs(info.start).fromNow()}
              </small>
              <Button
                color={info.isActive ? 'warning' : 'danger'}
                variant="light"
                isIconOnly
                size="sm"
                className="absolute right-2 transform"
                onPress={() => {
                  close(info.id)
                }}
              >
                {info.isActive ? <CgClose className="text-lg" /> : <CgTrash className="text-lg" />}
              </Button>
            </CardHeader>
            <CardFooter className="pt-2">
              <div className="flex gap-1 overflow-x-auto no-scrollbar">
                <Chip
                  color={info.isActive ? 'primary' : 'danger'}
                  size="sm"
                  radius="sm"
                  variant="dot"
                >
                  {info.metadata.type}({info.metadata.network.toUpperCase()})
                </Chip>
                <Chip
                  className="flag-emoji whitespace-nowrap overflow-hidden"
                  size="sm"
                  radius="sm"
                  variant="bordered"
                >
                  {info.chains[0]}
                </Chip>
                <Chip size="sm" radius="sm" variant="bordered">
                  ↑ {calcTraffic(info.upload)} ↓ {calcTraffic(info.download)}
                </Chip>
                {info.uploadSpeed || info.downloadSpeed ? (
                  <Chip color="primary" size="sm" radius="sm" variant="bordered">
                    ↑ {calcTraffic(info.uploadSpeed || 0)}/s ↓{' '}
                    {calcTraffic(info.downloadSpeed || 0)}
                    /s
                  </Chip>
                ) : null}
              </div>
            </CardFooter>
          </div>
        </div>
      </Card>
    </div>
  )
})

export default ConnectionItem
