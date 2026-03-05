import { Navbar, NavbarCenter } from '@renderer/components/app/Navbar'
import { DraggableList } from '@renderer/components/DraggableList'
import { DeleteIcon, EditIcon } from '@renderer/components/Icons'
import ListItem from '@renderer/components/ListItem'
import PromptPopup from '@renderer/components/Popups/PromptPopup'
import Scrollbar from '@renderer/components/Scrollbar'
import { useKnowledgeBases } from '@renderer/hooks/useKnowledge'
import { useShortcut } from '@renderer/hooks/useShortcuts'
import KnowledgeSearchPopup from '@renderer/pages/knowledge/components/KnowledgeSearchPopup'
import { useAppSelector } from '@renderer/store'
import { selectAuthUser, selectCanEditPublicKB, selectIsAdmin } from '@renderer/store/authStore'
import type { KnowledgeBase } from '@renderer/types'
import type { MenuProps } from 'antd'
import { Dropdown, Empty } from 'antd'
import { Book, Settings, Globe, Plus } from 'lucide-react'
import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import AddKnowledgeBasePopup from './components/AddKnowledgeBasePopup'
import EditKnowledgeBasePopup from './components/EditKnowledgeBasePopup'
import KnowledgeContent from './KnowledgeContent'

const KnowledgePage: FC = () => {
  const { t } = useTranslation()
  const { bases, renameKnowledgeBase, deleteKnowledgeBase, updateKnowledgeBases } = useKnowledgeBases()
  const [selectedBase, setSelectedBase] = useState<KnowledgeBase | undefined>(bases[0])
  const [isDragging, setIsDragging] = useState(false)
  const authUser = useAppSelector(selectAuthUser)
  const isAdmin = useAppSelector(selectIsAdmin)
  const canEditPublicKB = useAppSelector(selectCanEditPublicKB)

  const publicBases = bases.filter((b) => (b as any).isPublic === true)
  const userBases = bases.filter(
    (b) => (b as any).isPublic !== true && ((b as any).ownerId === authUser.userId || isAdmin)
  )

  const handleAddKnowledge = useCallback(
    async (isPublic?: boolean) => {
      const newBase = await AddKnowledgeBasePopup.show({ title: t('knowledge.add.title'), isPublic })
      if (newBase) {
        setSelectedBase(newBase)
      }
    },
    [t]
  )

  const handleEditKnowledgeBase = useCallback(async (base: KnowledgeBase) => {
    const newBase = await EditKnowledgeBasePopup.show({ base })
    if (newBase && newBase?.id !== base.id) {
      setSelectedBase(newBase)
    }
  }, [])

  useEffect(() => {
    const hasSelectedBase = bases.find((base) => base.id === selectedBase?.id)
    !hasSelectedBase && setSelectedBase(bases[0])
  }, [bases, selectedBase])

  const getMenuItems = useCallback(
    (base: KnowledgeBase) => {
      const entry = base as any
      const canModify =
        isAdmin || (entry.isPublic && canEditPublicKB) || (entry.ownerId === authUser.userId && !entry.isPublic)

      const menus: MenuProps['items'] = []

      if (canModify) {
        menus.push({
          label: t('knowledge.rename'),
          key: 'rename',
          icon: <EditIcon size={14} />,
          async onClick() {
            const name = await PromptPopup.show({
              title: t('knowledge.rename'),
              message: '',
              defaultValue: base.name || ''
            })
            if (name && base.name !== name) {
              renameKnowledgeBase(base.id, name)
            }
          }
        })
      }

      menus.push({
        label: t('common.settings'),
        key: 'settings',
        icon: <Settings size={14} />,
        onClick: () => handleEditKnowledgeBase(base)
      })

      if (canModify) {
        menus.push({ type: 'divider' } as any, {
          label: t('common.delete'),
          danger: true,
          key: 'delete',
          icon: <DeleteIcon size={14} className="lucide-custom" />,
          onClick: () => {
            window.modal.confirm({
              title: t('knowledge.delete_confirm'),
              centered: true,
              onOk: () => {
                setSelectedBase(undefined)
                deleteKnowledgeBase(base.id)
              }
            })
          }
        })
      }

      return menus
    },
    [authUser.userId, isAdmin, canEditPublicKB, deleteKnowledgeBase, handleEditKnowledgeBase, renameKnowledgeBase, t]
  )

  useShortcut('search_message', () => {
    if (selectedBase) {
      KnowledgeSearchPopup.show({ base: selectedBase }).then()
    }
  })

  return (
    <Container>
      <Navbar>
        <NavbarCenter style={{ borderRight: 'none' }}>{t('knowledge.title')}</NavbarCenter>
      </Navbar>
      <ContentContainer id="content-container">
        <KnowledgeSideNav>
          {/* Public Bases */}
          <SectionHeader>
            <SectionTitle>{t('knowledge.public') || 'Public Knowledge'}</SectionTitle>
            {canEditPublicKB && (
              <AddSectionButton onClick={() => handleAddKnowledge(true)}>
                <Plus size={14} />
              </AddSectionButton>
            )}
          </SectionHeader>
          {publicBases.map((base) => (
            <Dropdown menu={{ items: getMenuItems(base) }} trigger={['contextMenu']} key={base.id}>
              <div>
                <ListItem
                  active={selectedBase?.id === base.id}
                  icon={<Globe size={16} />}
                  title={base.name}
                  onClick={() => setSelectedBase(base)}
                />
              </div>
            </Dropdown>
          ))}
          {publicBases.length > 0 && <div style={{ marginBottom: 10 }}></div>}

          {/* Private Bases */}
          <SectionHeader>
            <SectionTitle>{t('knowledge.private') || 'My Knowledge'}</SectionTitle>
            <AddSectionButton onClick={() => handleAddKnowledge(false)}>
              <Plus size={14} />
            </AddSectionButton>
          </SectionHeader>
          <DraggableList
            list={userBases}
            onUpdate={(newList) => updateKnowledgeBases([...publicBases, ...newList])}
            style={{ marginBottom: 0, paddingBottom: isDragging ? 50 : 0 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}>
            {(base: KnowledgeBase) => (
              <Dropdown menu={{ items: getMenuItems(base) }} trigger={['contextMenu']} key={base.id}>
                <div>
                  <ListItem
                    active={selectedBase?.id === base.id}
                    icon={<Book size={16} />}
                    title={base.name}
                    onClick={() => setSelectedBase(base)}
                  />
                </div>
              </Dropdown>
            )}
          </DraggableList>
          <div style={{ minHeight: '10px' }}></div>
        </KnowledgeSideNav>
        {bases.length === 0 ? (
          <MainContent>
            <Empty description={t('knowledge.empty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </MainContent>
        ) : selectedBase ? (
          <KnowledgeContent selectedBase={selectedBase} />
        ) : null}
      </ContentContainer>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  height: calc(100vh - var(--navbar-height));
`

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  min-height: 100%;
`

const MainContent = styled(Scrollbar)`
  padding: 15px 20px;
  display: flex;
  width: 100%;
  flex-direction: column;
  padding-bottom: 50px;
`

const KnowledgeSideNav = styled(Scrollbar)`
  display: flex;
  flex-direction: column;

  width: calc(var(--settings-width) + 100px);
  border-right: 0.5px solid var(--color-border);
  padding: 12px 10px;

  .ant-menu {
    border-inline-end: none !important;
    background: transparent;
    flex: 1;
  }

  .ant-menu-item {
    height: 40px;
    line-height: 40px;
    margin: 4px 0;
    width: 100%;

    &:hover {
      background-color: var(--color-background-soft);
    }

    &.ant-menu-item-selected {
      background-color: var(--color-background-soft);
      color: var(--color-primary);
    }
  }

  > div {
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }
`

const SectionTitle = styled.div`
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
  margin-left: 12px;
  font-weight: 500;
`

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  margin-right: 8px;

  ${SectionTitle} {
    margin-bottom: 0;
  }
`

const AddSectionButton = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  border-radius: 4px;
  padding: 2px;
  &:hover {
    color: var(--color-text);
    background-color: var(--color-background-soft);
  }
`

export default KnowledgePage
