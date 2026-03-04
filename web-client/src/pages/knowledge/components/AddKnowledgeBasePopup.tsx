import { loggerService } from '@logger'
import { TopView } from '@renderer/components/TopView'
import { useKnowledgeBases } from '@renderer/hooks/useKnowledge'
import { useKnowledgeBaseForm } from '@renderer/hooks/useKnowledgeBaseForm'
import { getKnowledgeBaseParams } from '@renderer/services/KnowledgeService'
import type { KnowledgeBase } from '@renderer/types'
import { formatErrorMessage } from '@renderer/utils/error'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  AdvancedSettingsPanel,
  GeneralSettingsPanel,
  KnowledgeBaseFormModal,
  type PanelConfig
} from './KnowledgeSettings'

const logger = loggerService.withContext('AddKnowledgeBasePopup')

interface ShowParams {
  title: string
  isPublic?: boolean
}

interface PopupContainerProps extends ShowParams {
  resolve: (data: any) => void
}

const PopupContainer: React.FC<PopupContainerProps> = ({ title, isPublic, resolve }) => {
  const [open, setOpen] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { t } = useTranslation()
  const { addKnowledgeBase } = useKnowledgeBases()
  const isRealElectron = typeof window.electron?.process?.platform === 'string'
  const {
    newBase,
    setNewBase,
    handlers,
    providerData: { selectedDocPreprocessProvider, docPreprocessSelectOptions }
  } = useKnowledgeBaseForm()

  const onOk = async () => {
    if (submitting) {
      return
    }
    if (!newBase.name?.trim()) {
      window.toast.error(t('knowledge.name_required'))
      return
    }

    if (!newBase.model) {
      window.toast.error(t('knowledge.embedding_model_required'))
      return
    }

    try {
      setSubmitting(true)
      const _newBase: any = {
        ...newBase,
        created_at: Date.now(),
        updated_at: Date.now(),
        ...(isPublic ? { isPublic: true } : {})
      }

      const payload = isRealElectron ? getKnowledgeBaseParams(_newBase) : _newBase
      await window.api.knowledgeBase.create(payload as any)

      addKnowledgeBase(_newBase)
      setOpen(false)
      resolve(_newBase)
    } catch (error) {
      logger.error('KnowledgeBase creation failed:', error as Error)
      window.toast.error(t('knowledge.error.failed_to_create') + formatErrorMessage(error))
      setSubmitting(false)
    }
  }

  const onCancel = () => {
    setOpen(false)
  }

  const panelConfigs: PanelConfig[] = [
    {
      key: 'general',
      label: t('settings.general.label'),
      panel: <GeneralSettingsPanel newBase={newBase} setNewBase={setNewBase} handlers={handlers} />
    },
    {
      key: 'advanced',
      label: t('settings.advanced.title'),
      panel: (
        <AdvancedSettingsPanel
          newBase={newBase}
          selectedDocPreprocessProvider={selectedDocPreprocessProvider}
          docPreprocessSelectOptions={docPreprocessSelectOptions}
          handlers={handlers}
        />
      )
    }
  ]

  return (
    <KnowledgeBaseFormModal
      title={title}
      open={open}
      confirmLoading={submitting}
      onOk={onOk}
      onCancel={onCancel}
      afterClose={() => resolve(null)}
      panels={panelConfigs}
    />
  )
}

export default class AddKnowledgeBasePopup {
  static TopViewKey = 'AddKnowledgeBasePopup'

  static hide() {
    TopView.hide(this.TopViewKey)
  }

  static show(props: ShowParams) {
    return new Promise<any>((resolve) => {
      TopView.show(
        <PopupContainer
          {...props}
          resolve={(v) => {
            resolve(v)
            this.hide()
          }}
        />,
        this.TopViewKey
      )
    })
  }
}
