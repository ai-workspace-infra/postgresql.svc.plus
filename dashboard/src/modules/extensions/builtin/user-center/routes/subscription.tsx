import Card from '../components/Card'
import SubscriptionPanel from '../account/SubscriptionPanel'

export default function UserCenterSubscriptionRoute() {
  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-2xl font-semibold text-gray-900">支付与订阅</h1>
        <p className="mt-2 text-sm text-gray-600">
          支持 PayPal / 以太坊 ETH / USDT（TRC20）扫码支付。完成后系统会自动识别订单并开通或续订。
        </p>
        <p className="mt-1 text-sm text-gray-600">
          流程：先选择产品模式（PAYG / SaaS），再选择支付方式，扫码支付 → 自动识别到账。
        </p>
      </Card>
      <SubscriptionPanel />
    </div>
  )
}
