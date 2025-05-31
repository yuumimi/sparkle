import React, { useEffect, useState } from 'react'
import SettingCard from '../base/base-setting-card'
import SettingItem from '../base/base-setting-item'
import { Button, Select, SelectItem, Switch, Tab, Tabs } from '@heroui/react'
import { BiSolidFileImport } from 'react-icons/bi'
import {
  applyTheme,
  closeFloatingWindow,
  closeTrayIcon,
  fetchThemes,
  getFilePath,
  importThemes,
  relaunchApp,
  resolveThemes,
  showFloatingWindow,
  showTrayIcon,
  startMonitor,
  writeTheme
} from '@renderer/utils/ipc'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import { platform } from '@renderer/utils/init'
import { useTheme } from 'next-themes'
import { IoMdCloudDownload } from 'react-icons/io'
import { MdEditDocument } from 'react-icons/md'
import CSSEditorModal from './css-editor-modal'

const AppearanceConfig: React.FC = () => {
  const { appConfig, patchAppConfig } = useAppConfig()
  const [customThemes, setCustomThemes] = useState<{ key: string; label: string }[]>()
  const [openCSSEditor, setOpenCSSEditor] = useState(false)
  const [fetching, setFetching] = useState(false)
  const { setTheme } = useTheme()
  const {
    useDockIcon = true,
    showTraffic = false,
    proxyInTray = true,
    disableTray = false,
    showFloatingWindow: showFloating = false,
    spinFloatingIcon = true,
    useWindowFrame = false,
    customTheme = 'default.css',
    appTheme = 'system'
  } = appConfig || {}

  useEffect(() => {
    resolveThemes().then((themes) => {
      setCustomThemes(themes)
    })
  }, [])

  return (
    <>
      {openCSSEditor && (
        <CSSEditorModal
          theme={customTheme}
          onCancel={() => setOpenCSSEditor(false)}
          onConfirm={async (css: string) => {
            await writeTheme(customTheme, css)
            await applyTheme(customTheme)
            setOpenCSSEditor(false)
          }}
        />
      )}
      <SettingCard title="外观设置">
        <SettingItem title="显示悬浮窗" divider>
          <Switch
            size="sm"
            isSelected={showFloating}
            onValueChange={async (v) => {
              await patchAppConfig({ showFloatingWindow: v })
              if (v) {
                showFloatingWindow()
              } else {
                closeFloatingWindow()
              }
            }}
          />
        </SettingItem>

        {showFloating && (
          <>
            <SettingItem title="根据网速旋转悬浮窗图标" divider>
              <Switch
                size="sm"
                isSelected={spinFloatingIcon}
                onValueChange={async (v) => {
                  await patchAppConfig({ spinFloatingIcon: v })
                  window.electron.ipcRenderer.send('updateFloatingWindow')
                }}
              />
            </SettingItem>
            <SettingItem title="禁用托盘图标" divider>
              <Switch
                size="sm"
                isSelected={disableTray}
                onValueChange={async (v) => {
                  await patchAppConfig({ disableTray: v })
                  if (v) {
                    closeTrayIcon()
                  } else {
                    showTrayIcon()
                  }
                }}
              />
            </SettingItem>
          </>
        )}
        {platform !== 'linux' && (
          <>
            <SettingItem title="托盘菜单显示节点信息" divider>
              <Switch
                size="sm"
                isSelected={proxyInTray}
                onValueChange={async (v) => {
                  await patchAppConfig({ proxyInTray: v })
                }}
              />
            </SettingItem>
            <SettingItem
              title={`${platform === 'win32' ? '任务栏' : '状态栏'}显示网速信息`}
              divider
            >
              <Switch
                size="sm"
                isSelected={showTraffic}
                onValueChange={async (v) => {
                  await patchAppConfig({ showTraffic: v })
                  await startMonitor()
                }}
              />
            </SettingItem>
          </>
        )}
        {platform === 'darwin' && (
          <>
            <SettingItem title="显示 Dock 图标" divider>
              <Switch
                size="sm"
                isSelected={useDockIcon}
                onValueChange={async (v) => {
                  await patchAppConfig({ useDockIcon: v })
                }}
              />
            </SettingItem>
          </>
        )}
        <SettingItem title="使用系统标题栏" divider>
          <Switch
            size="sm"
            isSelected={useWindowFrame}
            onValueChange={async (v) => {
              await patchAppConfig({ useWindowFrame: v })
              await relaunchApp()
            }}
          />
        </SettingItem>
        <SettingItem title="背景色" divider>
          <Tabs
            size="sm"
            color="primary"
            selectedKey={appTheme}
            onSelectionChange={(key) => {
              setTheme(key.toString())
              patchAppConfig({ appTheme: key as AppTheme })
            }}
          >
            <Tab key="system" title="自动" />
            <Tab key="dark" title="深色" />
            <Tab key="light" title="浅色" />
          </Tabs>
        </SettingItem>
        <SettingItem
          title="主题"
          actions={
            <>
              <Button
                size="sm"
                isLoading={fetching}
                isIconOnly
                title="拉取主题"
                variant="light"
                onPress={async () => {
                  setFetching(true)
                  try {
                    await fetchThemes()
                    setCustomThemes(await resolveThemes())
                  } catch (e) {
                    alert(e)
                  } finally {
                    setFetching(false)
                  }
                }}
              >
                <IoMdCloudDownload className="text-lg" />
              </Button>
              <Button
                size="sm"
                isIconOnly
                title="导入主题"
                variant="light"
                onPress={async () => {
                  const files = await getFilePath(['css'])
                  if (!files) return
                  try {
                    await importThemes(files)
                    setCustomThemes(await resolveThemes())
                  } catch (e) {
                    alert(e)
                  }
                }}
              >
                <BiSolidFileImport className="text-lg" />
              </Button>
              <Button
                size="sm"
                isIconOnly
                title="编辑主题"
                variant="light"
                onPress={async () => {
                  setOpenCSSEditor(true)
                }}
              >
                <MdEditDocument className="text-lg" />
              </Button>
            </>
          }
        >
          {customThemes && (
            <Select
              classNames={{ trigger: 'data-[hover=true]:bg-default-200' }}
              className="w-[60%]"
              size="sm"
              selectedKeys={new Set([customTheme])}
              disallowEmptySelection={true}
              onSelectionChange={async (v) => {
                try {
                  await patchAppConfig({ customTheme: v.currentKey as string })
                } catch (e) {
                  alert(e)
                }
              }}
            >
              {customThemes.map((theme) => (
                <SelectItem key={theme.key}>{theme.label}</SelectItem>
              ))}
            </Select>
          )}
        </SettingItem>
      </SettingCard>
    </>
  )
}

export default AppearanceConfig
