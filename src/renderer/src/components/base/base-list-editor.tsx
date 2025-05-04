import React from 'react'
import { Button, Divider, Input } from '@heroui/react'
import { MdDeleteForever } from 'react-icons/md'

interface EditableListProps {
  title?: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
  part2Placeholder?: string
  parse?: (item: string) => { part1: string; part2?: string }
  format?: (part1: string, part2?: string) => string
  disableFirst?: boolean
  divider?: boolean
}

const EditableList: React.FC<EditableListProps> = ({
  title,
  items,
  onChange,
  placeholder = '',
  part2Placeholder = '',
  parse,
  format,
  disableFirst = false,
  divider = true
}) => {
  const displayedItems = [...items, '']

  const handleUpdate = (index: number, part1: string, part2: string) => {
    if (index < items.length && part1.trim() === '' && part2.trim() === '') {
      onChange(items.filter((_, i) => i !== index))
      return
    }
    const entry = format ? format(part1, part2) : part1
    const newItems = [...items]
    if (index === items.length) {
      if (entry.trim() === '') return
      newItems.push(entry)
    } else {
      newItems[index] = entry
    }
    onChange(newItems)
  }

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <>
      <div className="flex flex-col items-stretch mt-2 space-y-2">
        {title && <h4 className="mb-2 text-base font-medium">{title}</h4>}
        {displayedItems.map((item, index) => {
          const parsed = parse ? parse(item) : { part1: item, part2: '' }
          const part1 = parsed.part1 || ''
          const part2 = parsed.part2 ?? ''
          const isDisabled = disableFirst && index === 0
          const showDeleteButton = index < items.length && !isDisabled

          return (
            <div key={index} className="flex items-center space-x-2">
              <div className={parse ? 'w-1/3' : 'flex-1'}>
                <Input
                  size="sm"
                  fullWidth
                  disabled={isDisabled}
                  placeholder={placeholder}
                  value={part1}
                  onValueChange={(v) => handleUpdate(index, v, part2)}
                />
              </div>
              {parse && (
                <>
                  <span className="mx-1">:</span>
                  <div className="flex-1">
                    <Input
                      size="sm"
                      fullWidth
                      placeholder={part2Placeholder}
                      value={part2}
                      onValueChange={(v) => handleUpdate(index, part1, v)}
                    />
                  </div>
                </>
              )}
              {showDeleteButton && (
                <Button
                  size="sm"
                  variant="flat"
                  color="warning"
                  onPress={() => handleRemove(index)}
                >
                  <MdDeleteForever className="text-lg" />
                </Button>
              )}
            </div>
          )
        })}
      </div>
      {divider && <Divider className="mt-2 mb-2" />}
    </>
  )
}

export default EditableList
