'use client'

import dynamic from 'next/dynamic'

const WaterDashboard = dynamic(
  () => import('../components/WaterDashboard'),
  {
    ssr: false,
    loading: () => (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" />
      </div>
    ),
  }
)

export default function WaterTaxDashboardPage() {
  return <WaterDashboard />
}
