import { addProfileItem, getCurrentProfileItem, getProfileConfig } from '../config'

const intervalPool: Record<string, NodeJS.Timeout> = {}

function calculateUpdateDelay(item: ProfileItem): number {
  if (!item.interval) {
    return -1
  }

  const now = Date.now()
  const lastUpdated = item.updated || 0
  const intervalMs = item.interval * 60 * 1000
  const timeSinceLastUpdate = now - lastUpdated

  if (timeSinceLastUpdate >= intervalMs) {
    return 0
  }

  return intervalMs - timeSinceLastUpdate
}

export async function initProfileUpdater(): Promise<void> {
  const { items, current } = await getProfileConfig()
  const currentItem = await getCurrentProfileItem()
  for (const item of items.filter((i) => i.id !== current)) {
    if (item.type === 'remote' && item.interval) {
      const delay = calculateUpdateDelay(item)

      if (delay === -1) {
        continue
      }

      if (delay === 0) {
        try {
          await addProfileItem(item)
        } catch (e) {
          // ignore
        }
      }

      intervalPool[item.id] = setTimeout(
        async () => {
          try {
            await addProfileItem(item)
          } catch (e) {
            // ignore
          }
        },
        delay === 0 ? item.interval * 60 * 1000 : delay
      )
    }
  }

  if (currentItem?.type === 'remote' && currentItem.interval) {
    const delay = calculateUpdateDelay(currentItem)

    if (delay === 0) {
      try {
        await addProfileItem(currentItem)
      } catch (e) {
        // ignore
      }
    }

    intervalPool[currentItem.id] = setTimeout(
      async () => {
        try {
          await addProfileItem(currentItem)
        } catch (e) {
          // ignore
        }
      },
      (delay === 0 ? currentItem.interval * 60 * 1000 : delay) + 10000 // +10s
    )
  }
}

export async function addProfileUpdater(item: ProfileItem): Promise<void> {
  if (item.type === 'remote' && item.interval) {
    if (intervalPool[item.id]) {
      clearTimeout(intervalPool[item.id])
    }

    const delay = calculateUpdateDelay(item)

    if (delay === -1) {
      return
    }

    if (delay === 0) {
      try {
        await addProfileItem(item)
      } catch (e) {
        // ignore
      }
    }

    intervalPool[item.id] = setTimeout(
      async () => {
        try {
          await addProfileItem(item)
        } catch (e) {
          // ignore
        }
      },
      delay === 0 ? item.interval * 60 * 1000 : delay
    )
    console.log(`Profile ${item.name} updater set with interval ${item.interval} minutes.`)
  }
}

export async function delProfileUpdater(id: string): Promise<void> {
  if (intervalPool[id]) {
    clearTimeout(intervalPool[id])
    delete intervalPool[id]
  }
}
