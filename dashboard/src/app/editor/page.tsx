import EditorShell from '../../dashboard/apps/cms-editor/EditorShell'
import { localDraftStore } from '../../dashboard/apps/cms-editor/storage/local'

export default function EditorPage() {
  return <EditorShell store={localDraftStore} mode="public" />
}
