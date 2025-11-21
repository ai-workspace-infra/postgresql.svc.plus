import Card from '../components/Card'
import SubscriptionPanel from '../account/SubscriptionPanel'

export default function UserCenterSubscriptionRoute() {
  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-2xl font-semibold text-gray-900">订阅与支付</h1>
        <p className="mt-2 text-sm text-gray-600">
          支持 PayPal、以太坊与 USDT 的订阅与按量计费，扫码或直连支付后都可同步到账户中心。
        </p>
      </Card>
      <SubscriptionPanel />
    </div>
  )
}
