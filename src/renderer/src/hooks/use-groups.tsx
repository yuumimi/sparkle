import React, { createContext, useContext, ReactNode, useMemo } from 'react'
import useSWR from 'swr'
import { mihomoGroups } from '@renderer/utils/ipc'

interface GroupsContextType {
  groups: ControllerMixedGroup[] | undefined
  mutate: () => void
}

const GroupsContext = createContext<GroupsContextType | undefined>(undefined)

export const GroupsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: groups, mutate } = useSWR<ControllerMixedGroup[]>('mihomoGroups', mihomoGroups, {
    errorRetryInterval: 200,
    errorRetryCount: 10
  })

  React.useEffect(() => {
    window.electron.ipcRenderer.on('groupsUpdated', () => {
      mutate()
    })
    return (): void => {
      window.electron.ipcRenderer.removeAllListeners('groupsUpdated')
    }
  }, [])

  return <GroupsContext.Provider value={{ groups, mutate }}>{children}</GroupsContext.Provider>
}

export const useGroups = (): GroupsContextType => {
  const context = useContext(GroupsContext)
  if (context === undefined) {
    throw new Error('useGroups must be used within an GroupsProvider')
  }
  return context
}
export const useVisibleGroups = (mode: OutboundMode = 'rule'): GroupsContextType => {
  const { groups, mutate } = useGroups()
  const visibleGroups = useMemo(() => {
    if (!groups) return undefined
    if (mode === 'global') {
      return groups.filter((group) => group.name === 'GLOBAL')
    }
    if (mode === 'rule') {
      return groups.filter((group) => group.name !== 'GLOBAL')
    }
    return groups
  }, [groups, mode])
  return { groups: visibleGroups, mutate }
}
