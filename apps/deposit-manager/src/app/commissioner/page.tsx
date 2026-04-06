'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/deposits/auth';
import { User, DashboardStats } from '@/lib/deposits/types';
import { formatAmount } from '@/lib/deposits/formatters';
import { depositApi } from '@/lib/deposits';
import DepositNavigation from '@/components/deposits/DepositNavigation';
import LoadingSpinner, { PageLoader } from '@/components/deposits/LoadingSpinner';

type BankAnalyticsRow = {
  bankId: string;
  bankName: string;
  investedAmount: number;
  interestRate: number;
  interestIncome: number;
};

type MaturityRow = {
  requirementId: string;
  schemeName: string;
  bankId: string;
  bankName: string;
  amount: number;
  interestRate: number;
  depositPeriod: number;
  maturityDate: string;
  daysLeft: number;
};

type DepositDistributionRow = {
  depositType: string;
  totalAmount: number;
  depositCount: number;
  percentageShare: number;
};

type InterestTimelineRow = {
  timelineMonth: string;
  timelineLabel: string;
  projectedInterestIncome: number;
  maturingDepositsCount: number;
};

type PortfolioHealth = {
  healthScore: number;
  diversificationScore: number;
  concentrationScore: number;
  maturitiesScore: number;
  rateOptimizationScore: number;
  totalBanks: number;
  maxConcentrationPercent: number;
  avgInterestRate: number;
  nearestMaturityDays: number;
};

type EnhancedKpis = {
  totalInvestedAmount: number;
  annualInterestIncome: number;
  finalizedDepositsCount: number;
  upcomingMaturities90Days: number;
  upcoming30Days: number;
  upcoming60Days: number;
  upcoming90Days: number;
  pendingAuthorizations: number;
};

const formatCompactCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

const normalizeDepositType = (type: string) => {
  const normalized = (type || '').toLowerCase();
  if (normalized === 'non-callable') return 'Non-Callable';
  if (normalized === 'callable') return 'Callable';
  return type || 'Unknown';
};

const maturityRowClass = (daysLeft: number) => {
  if (daysLeft <= 30) return 'bg-red-50';
  if (daysLeft <= 60) return 'bg-orange-50';
  if (daysLeft <= 90) return 'bg-yellow-50';
  return 'bg-white';
};

export default function CommissionerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [enhancedKpis, setEnhancedKpis] = useState<EnhancedKpis | null>(null);
  const [bankAnalytics, setBankAnalytics] = useState<BankAnalyticsRow[]>([]);
  const [upcomingMaturities, setUpcomingMaturities] = useState<MaturityRow[]>([]);
  const [distribution, setDistribution] = useState<DepositDistributionRow[]>([]);
  const [timeline, setTimeline] = useState<InterestTimelineRow[]>([]);
  const [portfolioHealth, setPortfolioHealth] = useState<PortfolioHealth | null>(null);
  const [selectedWindow, setSelectedWindow] = useState<30 | 60 | 90 | 'all'>(90);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'commissioner') {
      router.push('/login');
      return;
    }

    setUser(currentUser);
    loadData(currentUser);
  }, [router]);

  const loadData = async (currentUser: User) => {
    try {
      const [
        statsData,
        enhancedKpiData,
        bankWiseData,
        maturitiesData,
        distributionData,
        timelineData,
        portfolioHealthData,
      ] = await Promise.all([
        depositApi.getDashboardStats(currentUser.role, currentUser.id),
        depositApi.getCommissionerEnhancedKpis(),
        depositApi.getCommissionerBankWiseAnalytics(),
        depositApi.getCommissionerUpcomingMaturities(90),
        depositApi.getCommissionerDepositTypeDistribution(),
        depositApi.getCommissionerInterestTimeline(12),
        depositApi.getCommissionerPortfolioHealth(),
      ]);

      setStats(statsData);
      setEnhancedKpis(enhancedKpiData);
      setBankAnalytics(bankWiseData);
      setUpcomingMaturities(maturitiesData);
      setDistribution(distributionData);
      setTimeline(timelineData);
      setPortfolioHealth(portfolioHealthData);
    } catch (error) {
      console.error('Error loading commissioner dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMaturities = upcomingMaturities.filter((item) => {
    if (selectedWindow === 'all') return true;
    return item.daysLeft <= selectedWindow;
  });

  const maxBankAmount = bankAnalytics.reduce((max, item) => Math.max(max, item.investedAmount), 0);
  const maxTimelineIncome = timeline.reduce((max, item) => Math.max(max, item.projectedInterestIncome), 0);
  const urgentMaturities = upcomingMaturities.filter((item) => item.daysLeft <= 15);

  if (!user) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DepositNavigation user={user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Commissioner Dashboard</h1>
          <p className="text-gray-600 mt-2">Review and monitor portfolio performance</p>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-600">
                <p className="text-sm font-medium text-gray-600">Pending Authorizations</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.pendingAuthorizations || enhancedKpis?.pendingAuthorizations || 0}</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-600">
                <p className="text-sm font-medium text-gray-600">Active Requirements</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.activeRequirements || 0}</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
                <p className="text-sm font-medium text-gray-600">Finalized Deposits</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.finalizedRequirements || 0}</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-600">
                <p className="text-sm font-medium text-gray-600">Total Banks</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalBanks || 0}</p>
              </div>
            </div>

            {urgentMaturities.length > 0 && (
              <div className="mb-8 rounded-xl border border-red-300 bg-red-50 px-5 py-4">
                <p className="font-semibold text-red-800">Urgent maturity alert</p>
                <p className="text-sm text-red-700 mt-1">
                  {urgentMaturities.length} deposits are maturing in 15 days or less and require renewal planning.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <p className="text-sm font-medium text-gray-600">Total Invested</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{formatCompactCurrency(enhancedKpis?.totalInvestedAmount || 0)}</p>
                <p className="text-sm text-gray-500 mt-2">Across {enhancedKpis?.finalizedDepositsCount || 0} finalized deposits</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <p className="text-sm font-medium text-gray-600">Tentative Annual Interest</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{formatCompactCurrency(enhancedKpis?.annualInterestIncome || 0)}</p>
                <p className="text-sm text-gray-500 mt-2">Per annum (estimated)</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <p className="text-sm font-medium text-gray-600">Upcoming Maturities</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{enhancedKpis?.upcomingMaturities90Days || 0}</p>
                <p className="text-sm text-gray-500 mt-2">
                  30d: {enhancedKpis?.upcoming30Days || 0} | 60d: {enhancedKpis?.upcoming60Days || 0} | 90d: {enhancedKpis?.upcoming90Days || 0}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Bank-wise Investment and Interest</h2>
              {bankAnalytics.length === 0 ? (
                <p className="text-gray-600">No finalized bank analytics available.</p>
              ) : (
                <div className="space-y-4">
                  {bankAnalytics.map((item, idx) => {
                    const width = maxBankAmount > 0 ? Math.max((item.investedAmount / maxBankAmount) * 100, 4) : 0;
                    return (
                      <div
                        key={`${item.bankId || 'bank'}-${item.bankName || 'unknown'}-${item.investedAmount}-${idx}`}
                        className="rounded-lg border border-gray-200 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-gray-900">{item.bankName}</p>
                          <p className="text-sm text-gray-600">
                            Rate: <span className="font-semibold">{item.interestRate.toFixed(2)}%</span>
                          </p>
                        </div>
                        <div className="mt-3 h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${width}%` }} />
                        </div>
                        <div className="mt-2 flex flex-wrap justify-between text-sm text-gray-600 gap-2">
                          <span>Invested: {formatAmount(item.investedAmount)}</span>
                          <span>Estimated income: {formatAmount(item.interestIncome)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
              <div className="xl:col-span-2 bg-white rounded-xl shadow-md p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Upcoming Expiring Deposits</h2>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    {([30, 60, 90, 'all'] as const).map((windowValue) => (
                      <button
                        key={String(windowValue)}
                        onClick={() => setSelectedWindow(windowValue)}
                        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${selectedWindow === windowValue ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                      >
                        {windowValue === 'all' ? 'All' : `${windowValue} Days`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600 border-b border-gray-200">
                        <th className="py-2 pr-3">Scheme</th>
                        <th className="py-2 pr-3">Bank</th>
                        <th className="py-2 pr-3">Amount</th>
                        <th className="py-2 pr-3">Rate</th>
                        <th className="py-2 pr-3">Maturity</th>
                        <th className="py-2 pr-3">Days Left</th>
                        <th className="py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMaturities.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-gray-500">No maturities in selected range.</td>
                        </tr>
                      )}
                      {filteredMaturities.map((item, idx) => (
                        <tr
                          key={`${item.requirementId || 'req'}-${item.maturityDate || 'na'}-${item.bankId || 'bank'}-${idx}`}
                          className={`${maturityRowClass(item.daysLeft)} border-b border-gray-100`}
                        >
                          <td className="py-2 pr-3 font-medium text-gray-900">{item.schemeName}</td>
                          <td className="py-2 pr-3 text-gray-700">{item.bankName}</td>
                          <td className="py-2 pr-3 text-gray-700">{formatAmount(item.amount)}</td>
                          <td className="py-2 pr-3 text-gray-700">{item.interestRate.toFixed(2)}%</td>
                          <td className="py-2 pr-3 text-gray-700">{item.maturityDate ? new Date(item.maturityDate).toLocaleDateString() : '-'}</td>
                          <td className="py-2 pr-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.daysLeft <= 30 ? 'bg-red-100 text-red-700' : item.daysLeft <= 60 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {item.daysLeft}
                            </span>
                          </td>
                          <td className="py-2">
                            <button
                              onClick={() => router.push(`/commissioner/requirements/${item.requirementId}`)}
                              className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Deposit Type Distribution</h2>
                {distribution.length === 0 ? (
                  <p className="text-gray-600">No distribution data available.</p>
                ) : (
                  <div className="space-y-4">
                    {distribution.map((item, idx) => (
                      <div key={`${item.depositType || 'type'}-${item.totalAmount}-${idx}`}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-800">{normalizeDepositType(item.depositType)}</span>
                          <span className="text-gray-600">{item.percentageShare.toFixed(1)}%</span>
                        </div>
                        <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.depositType.toLowerCase().includes('non') ? 'bg-blue-600' : 'bg-green-600'}`}
                            style={{ width: `${Math.min(item.percentageShare, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {formatAmount(item.totalAmount)} across {item.depositCount} deposits
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Interest Income Timeline</h2>
              {timeline.length === 0 ? (
                <p className="text-gray-600">No timeline data available.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {timeline.map((item, idx) => {
                    const barHeight = maxTimelineIncome > 0 ? Math.max((item.projectedInterestIncome / maxTimelineIncome) * 100, 6) : 0;
                    return (
                      <div
                        key={`${item.timelineMonth || 'month'}-${item.timelineLabel || 'label'}-${item.projectedInterestIncome}-${idx}`}
                        className="rounded-lg border border-gray-100 p-3 bg-gray-50"
                      >
                        <p className="text-xs text-gray-500">{item.timelineLabel || item.timelineMonth}</p>
                        <div className="mt-3 h-20 bg-white rounded border border-gray-100 flex items-end px-2 py-2">
                          <div className="w-full bg-blue-500 rounded-sm" style={{ height: `${barHeight}%` }} />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 mt-2">{formatCompactCurrency(item.projectedInterestIncome)}</p>
                        <p className="text-xs text-gray-600">{item.maturingDepositsCount} maturing deposits</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6 lg:col-span-1">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Portfolio Health</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Overall Health Score</p>
                    <div className="mt-1 h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${portfolioHealth && portfolioHealth.healthScore >= 75 ? 'bg-green-600' : portfolioHealth && portfolioHealth.healthScore >= 50 ? 'bg-amber-500' : 'bg-red-600'}`}
                        style={{ width: `${Math.min(portfolioHealth?.healthScore || 0, 100)}%` }}
                      />
                    </div>
                    <p className="text-lg font-bold text-gray-900 mt-2">{portfolioHealth?.healthScore || 0} / 100</p>
                  </div>
                  <p className="text-sm text-gray-600">Diversification: {portfolioHealth?.diversificationScore || 0}</p>
                  <p className="text-sm text-gray-600">Concentration: {portfolioHealth?.concentrationScore || 0}</p>
                  <p className="text-sm text-gray-600">Maturity management: {portfolioHealth?.maturitiesScore || 0}</p>
                  <p className="text-sm text-gray-600">Rate optimization: {portfolioHealth?.rateOptimizationScore || 0}</p>
                  <p className="text-sm text-gray-600">Max bank concentration: {(portfolioHealth?.maxConcentrationPercent || 0).toFixed(2)}%</p>
                  <p className="text-sm text-gray-600">Average rate: {(portfolioHealth?.avgInterestRate || 0).toFixed(2)}%</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 lg:col-span-2">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => router.push('/commissioner/approvals')}
                    className="p-4 rounded-lg border border-gray-200 hover:border-blue-600 hover:bg-blue-50 text-left"
                  >
                    <p className="font-semibold text-gray-900">Go to Approvals</p>
                    <p className="text-sm text-gray-600 mt-1">Review pending and completed approvals.</p>
                  </button>

                  <button
                    onClick={() => router.push('/commissioner/reports')}
                    className="p-4 rounded-lg border border-gray-200 hover:border-blue-600 hover:bg-blue-50 text-left"
                  >
                    <p className="font-semibold text-gray-900">Full Reports</p>
                    <p className="text-sm text-gray-600 mt-1">Open commissioner analytics and export views.</p>
                  </button>

                  <button
                    onClick={() => router.push('/account/banks')}
                    className="p-4 rounded-lg border border-gray-200 hover:border-blue-600 hover:bg-blue-50 text-left"
                  >
                    <p className="font-semibold text-gray-900">View All Banks</p>
                    <p className="text-sm text-gray-600 mt-1">Check onboarded banks and participation.</p>
                  </button>

                  <button
                    onClick={() => router.push('/account/requirements/create')}
                    className="p-4 rounded-lg border border-gray-200 hover:border-blue-600 hover:bg-blue-50 text-left"
                  >
                    <p className="font-semibold text-gray-900">New Requirement</p>
                    <p className="text-sm text-gray-600 mt-1">Initiate renewal or create a new requirement.</p>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
