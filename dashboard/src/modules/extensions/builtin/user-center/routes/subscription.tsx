import Card from '../components/Card'
import BillingOptionsPanel from '../account/BillingOptionsPanel'
import SubscriptionPanel from '../account/SubscriptionPanel'

export default function UserCenterSubscriptionRoute() {
  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-2xl font-semibold text-gray-900">支付与订阅</h1>
        <p className="mt-2 text-sm text-gray-600">
          支持 PayPal / ETH（ERC20）/ USDT（TRC20）扫码支付。支付成功后系统将自动识别并开通或续订服务。
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-[color:var(--color-surface-muted)] p-3 text-sm text-gray-700 shadow-sm">
            <p className="font-semibold text-[color:var(--color-heading)]">步骤 1：选择产品模式</p>
            <p className="text-gray-600">PAYG（流量包）或 SaaS（订阅），两种模式分区展示，避免混淆。</p>
          </div>
          <div className="rounded-xl bg-[color:var(--color-surface-muted)] p-3 text-sm text-gray-700 shadow-sm">
            <p className="font-semibold text-[color:var(--color-heading)]">步骤 2：选择支付方式</p>
            <p className="text-gray-600">PayPal / ETH / USDT 三种扫码方式并列，二维码统一尺寸，信息层级一致。</p>
          </div>
          <div className="rounded-xl bg-[color:var(--color-surface-muted)] p-3 text-sm text-gray-700 shadow-sm">
            <p className="font-semibold text-[color:var(--color-heading)]">步骤 3：自动识别到账</p>
            <p className="text-gray-600">扫码支付 → 系统自动识别付款 → 自动激活或续订订单，全程无需手工确认。</p>
          </div>
        </div>
      </Card>
      <BillingOptionsPanel />
      <SubscriptionPanel />
    </div>
  )
}
