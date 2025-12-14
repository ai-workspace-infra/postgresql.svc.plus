import EditorShell from '../../../dashboard/apps/cms-editor/EditorShell'
import { localDraftStore } from '../../../dashboard/apps/cms-editor/storage/local'
import { remoteDraftStore } from '../../../dashboard/apps/cms-editor/storage/remote'

export default function CmsEditorDashboardPage() {
  return <EditorShell store={remoteDraftStore} fallbackStore={localDraftStore} mode="dashboard" />
}
