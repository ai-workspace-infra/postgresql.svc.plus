import MfaSetupPanel from '../account/MfaSetupPanel'
import UserOverview from '../components/UserOverview'

export default function UserCenterAccountRoute() {
  return (
    <div className="space-y-6">
      <UserOverview />
      <MfaSetupPanel />
    </div>
  )
}
