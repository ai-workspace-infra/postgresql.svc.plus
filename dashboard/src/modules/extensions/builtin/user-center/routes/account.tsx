import MfaSetupPanel from '../account/MfaSetupPanel'
import SubscriptionPanel from '../account/SubscriptionPanel'
import UserOverview from '../components/UserOverview'

export default function UserCenterAccountRoute() {
  return (
    <div className="space-y-6">
      <UserOverview />
      <MfaSetupPanel />
      <SubscriptionPanel />
    </div>
  )
}
