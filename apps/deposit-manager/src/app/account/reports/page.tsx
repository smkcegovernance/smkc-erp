'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/deposits/auth';
import { User, DepositRequirement, Bank, BankQuote } from '@/lib/deposits/types';
import DepositNavigation from '@/components/deposits/DepositNavigation';
import { PageLoader } from '@/components/deposits/LoadingSpinner';
import { depositApi } from '@/lib/deposits';
import { formatAmount } from '@/lib/deposits/formatters';

type ReportType = 'requirements' | 'quotes' | 'finalized' | 'performance' | 'monthly' | 'banks' | 'summary' | null;

export default function AccountReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeReport, setActiveReport] = useState<ReportType>(null);
  const [loading, setLoading] = useState(false);
  const [requirements, setRequirements] = useState<DepositRequirement[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [quotes, setQuotes] = useState<BankQuote[]>([]);

  const formatSubmittedDate = (value?: string | null) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
  };

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'account') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
  }, [router]);

  const loadReportData = async (reportType: ReportType) => {
    if (!reportType) return;
    
    setLoading(true);
    setActiveReport(reportType);

    try {
      switch (reportType) {
        case 'requirements':
        case 'finalized':
        case 'monthly':
          const reqs = await depositApi.getRequirements('account');
          setRequirements(reqs);
          break;
        case 'quotes':
        case 'performance':
          const allQuotes = await depositApi.getQuotes('account');
          setQuotes(allQuotes);
          const allReqs = await depositApi.getRequirements('account');
          setRequirements(allReqs);
          break;
        case 'summary': {
          const summaryReqs = await depositApi.getRequirements('account', { status: 'published' });
          const summaryQuotes = await depositApi.getQuotes('account');
          setRequirements(summaryReqs);
          setQuotes(summaryQuotes);
          break;
        }
        case 'banks':
          const allBanks = await depositApi.getBanks();
          setBanks(allBanks);
          break;
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (reportType: ReportType) => {
    let csvContent = '';
    let filename = '';

    switch (reportType) {
      case 'requirements':
        csvContent = 'Requirement ID,Amount,Duration (Months),Status,Created Date\n';
        requirements.forEach(req => {
          csvContent += `${req.id},${req.amount},${req.depositPeriod},${req.status},${new Date(req.createdAt).toLocaleDateString()}\n`;
        });
        filename = 'requirements_report.csv';
        break;
      case 'quotes':
        csvContent = 'Requirement ID,Bank,Interest Rate (%),Ranking,Remarks,Date\n';
        quotes.forEach(quote => {
          const req = requirements.find(r => r.id === quote.requirementId);
          csvContent += `${quote.requirementId},${quote.bankName},${quote.interestRate},${quote.ranking || 'N/A'},"${quote.remarks || ''}",${formatSubmittedDate(quote.submittedAt)}\n`;
        });
        filename = 'quotes_report.csv';
        break;
      case 'banks':
        csvContent = 'Bank Name,Contact Person,Email,Phone,MICR,IFSC,Status,Registration Date\n';
        banks.forEach(bank => {
          const regDate = bank.registrationDate ? new Date(bank.registrationDate).toLocaleDateString() : '';
          csvContent += `${bank.name},${bank.contactPerson},${bank.email},${bank.phone || bank.contactNo},${bank.micr || 'N/A'},${bank.ifsc || 'N/A'},${bank.status},${regDate}\n`;
        });
        filename = 'banks_report.csv';
        break;
      default:
        return;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!user) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DepositNavigation user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Deposit Reports</h1>
          <p className="text-gray-600 mt-2">View and download deposit management reports</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Requirements Report */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Requirements Report</h3>
            <p className="text-gray-600 text-sm mb-4">All deposit requirements with status and details</p>
            <button 
              onClick={() => loadReportData('requirements')}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading && activeReport === 'requirements' ? 'Loading...' : 'View Report'}
            </button>
          </div>

          {/* Bank Quotes Report */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Bank Quotes Report</h3>
            <p className="text-gray-600 text-sm mb-4">All quotes submitted by banks with rankings</p>
            <button 
              onClick={() => loadReportData('quotes')}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading && activeReport === 'quotes' ? 'Loading...' : 'View Report'}
            </button>
          </div>

          {/* Finalized Deposits Report */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Finalized Deposits</h3>
            <p className="text-gray-600 text-sm mb-4">All finalized deposit transactions</p>
            <button 
              onClick={() => loadReportData('finalized')}
              disabled={loading}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading && activeReport === 'finalized' ? 'Loading...' : 'View Report'}
            </button>
          </div>

          {/* Bank Performance Report */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Bank Performance</h3>
            <p className="text-gray-600 text-sm mb-4">Interest rates and participation analysis</p>
            <button 
              onClick={() => loadReportData('performance')}
              disabled={loading}
              className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading && activeReport === 'performance' ? 'Loading...' : 'View Report'}
            </button>
          </div>

          {/* Monthly Summary Report */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Monthly Summary</h3>
            <p className="text-gray-600 text-sm mb-4">Month-wise deposit summary and trends</p>
            <button 
              onClick={() => loadReportData('monthly')}
              disabled={loading}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading && activeReport === 'monthly' ? 'Loading...' : 'View Report'}
            </button>
          </div>

          {/* Requirement Summary Report */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-blue-200">
            <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Requirement Summary</h3>
            <p className="text-gray-600 text-sm mb-4">Printable scheme-wise summary with bank quotes &amp; rankings</p>
            <button
              onClick={() => loadReportData('summary')}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading && activeReport === 'summary' ? 'Loading...' : 'View &amp; Print'}
            </button>
          </div>

          {/* Registered Banks Report */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Registered Banks</h3>
            <p className="text-gray-600 text-sm mb-4">Complete list of registered banks</p>
            <button 
              onClick={() => loadReportData('banks')}
              disabled={loading}
              className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading && activeReport === 'banks' ? 'Loading...' : 'View Report'}
            </button>
          </div>
        </div>

        {/* Report Display Section */}
        {activeReport && !loading && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {activeReport === 'requirements' && 'Requirements Report'}
                {activeReport === 'quotes' && 'Bank Quotes Report'}
                {activeReport === 'finalized' && 'Finalized Deposits Report'}
                {activeReport === 'performance' && 'Bank Performance Report'}
                {activeReport === 'monthly' && 'Monthly Summary Report'}
                {activeReport === 'banks' && 'Registered Banks Report'}
                {activeReport === 'summary' && 'Requirement Summary Report'}
              </h2>
              <div className="flex gap-3">
                {activeReport === 'summary' && (
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print Report
                  </button>
                )}
                {activeReport !== 'summary' && (
                  <button
                    onClick={() => exportToCSV(activeReport)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export CSV
                  </button>
                )}
                <button
                  onClick={() => setActiveReport(null)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Requirements Report */}
            {activeReport === 'requirements' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requirement ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requirements.map((req) => (
                      <tr key={req.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatAmount(req.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.depositPeriod} months</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            req.status === 'published' ? 'bg-green-100 text-green-800' :
                            req.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                            req.status === 'finalized' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(req.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bank Quotes Report */}
            {activeReport === 'quotes' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requirement ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ranking</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {quotes.map((quote) => (
                      <tr key={quote.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{quote.requirementId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quote.bankName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quote.interestRate}%</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {quote.ranking ? (
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              quote.ranking === 'L1' ? 'bg-yellow-100 text-yellow-800' :
                              quote.ranking === 'L2' ? 'bg-gray-100 text-gray-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {quote.ranking}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{quote.remarks || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatSubmittedDate(quote.submittedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Finalized Deposits Report */}
            {activeReport === 'finalized' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requirement ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Finalized Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requirements.filter(req => req.status === 'finalized').length > 0 ? (
                      requirements.filter(req => req.status === 'finalized').map((req) => (
                        <tr key={req.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatAmount(req.amount)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.depositPeriod} months</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Finalized
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(req.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No finalized deposits yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bank Performance Report */}
            {activeReport === 'performance' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Quotes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">L1 Wins</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Interest Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participation Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.from(new Set(quotes.map(q => q.bankName))).map((bankName) => {
                      const bankQuotes = quotes.filter(q => q.bankName === bankName);
                      const l1Wins = bankQuotes.filter(q => q.ranking === 'L1').length;
                      const avgRate = (bankQuotes.reduce((sum, q) => sum + q.interestRate, 0) / bankQuotes.length).toFixed(2);
                      const participationRate = ((bankQuotes.length / requirements.length) * 100).toFixed(0);
                      
                      return (
                        <tr key={bankName}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bankName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bankQuotes.length}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{l1Wins}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{avgRate}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{participationRate}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Monthly Summary Report */}
            {activeReport === 'monthly' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requirements Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Finalized</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.from(new Set(requirements.map(req => new Date(req.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })))).map((month) => {
                      const monthReqs = requirements.filter(req => new Date(req.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) === month);
                      const totalAmount = monthReqs.reduce((sum, req) => sum + req.amount, 0);
                      const finalized = monthReqs.filter(req => req.status === 'finalized').length;
                      
                      return (
                        <tr key={month}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{month}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{monthReqs.length}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatAmount(totalAmount)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{finalized}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{monthReqs.length - finalized} Pending</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Requirement Summary Report - Printable */}
            {activeReport === 'summary' && (
              <div id="summary-print-area">
                <style>{`
                  @media print {
                    body * { visibility: hidden; }
                    #summary-print-area, #summary-print-area * { visibility: visible; }
                    #summary-print-area { position: absolute; top: 0; left: 0; width: 100%; }
                    .no-print { display: none !important; }
                    .scheme-block { break-inside: avoid; page-break-inside: avoid; }
                    .scheme-block + .scheme-block { break-before: page; page-break-before: always; }
                  }
                `}</style>
                {requirements.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No published requirements found.</div>
                ) : (
                  requirements.map((req) => {
                    const rankNum = (r?: string) => r ? parseInt(r.replace(/\D/g, '') || '999') : 999;
                    const reqQuotes = quotes
                      .filter(q => q.requirementId === req.id)
                      .sort((a, b) => rankNum(a.rank) - rankNum(b.rank) || b.interestRate - a.interestRate);
                    const reportDateTime = new Date().toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit', hour12: true
                    });
                    return (
                      <div key={req.id} className="scheme-block mb-12 p-6 border border-gray-200 rounded-xl">
                        {/* Header */}
                        <div className="border-b-2 border-blue-700 pb-4 mb-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h2 className="text-2xl font-bold text-blue-900">Summary Details</h2>
                              <p className="text-xs text-gray-500 mt-1">Sangli Miraj Kupwad City Municipal Corporation — Deposit Management</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Report Date &amp; Time</p>
                              <p className="text-sm font-semibold text-gray-800">{reportDateTime}</p>
                            </div>
                          </div>
                        </div>

                        {/* Scheme Info */}
                        <div className="mb-6 bg-blue-50 rounded-lg p-4">
                          <div className="flex flex-wrap gap-6 items-start">
                            <div className="flex-1 min-w-[200px]">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Scheme Name</p>
                              <p className="text-lg font-bold text-gray-900">{req.schemeName}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Amount</p>
                              <p className="text-lg font-bold text-blue-700">{formatAmount(req.amount)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Period</p>
                              <p className="text-lg font-bold text-gray-900">{req.depositPeriod} Months</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Type</p>
                              <p className="text-lg font-bold text-gray-900 capitalize">{req.depositType}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Requirement ID</p>
                              <p className="text-sm font-mono font-semibold text-gray-700">{req.id}</p>
                            </div>
                          </div>
                        </div>

                        {/* Quotes Table */}
                        {reqQuotes.length === 0 ? (
                          <div className="text-center py-6 text-gray-400 border border-dashed border-gray-200 rounded-lg">
                            No quotes submitted for this requirement yet.
                          </div>
                        ) : (
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-800 text-white">
                                <th className="px-4 py-3 text-left text-sm font-semibold w-14">Sr. No.</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold">Bank Name</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold w-36">Interest Rate</th>
                                <th className="px-4 py-3 text-center text-sm font-semibold w-24">Rank</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reqQuotes.map((quote, idx) => (
                                <tr
                                  key={quote.id}
                                  className={`border-b border-gray-100 ${
                                    quote.rank === 'L1' ? 'bg-yellow-50' :
                                    quote.rank === 'L2' ? 'bg-gray-50' : 'bg-white'
                                  }`}
                                >
                                  <td className="px-4 py-3 text-sm text-gray-600 text-center">{idx + 1}</td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    {quote.bankName || quote.bankId}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <span className="text-xl font-bold text-blue-700">{quote.interestRate}%</span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {quote.rank ? (
                                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                                        quote.rank === 'L1' ? 'bg-yellow-400 text-yellow-900' :
                                        quote.rank === 'L2' ? 'bg-gray-300 text-gray-800' :
                                        'bg-orange-300 text-orange-900'
                                      }`}>
                                        {quote.rank}
                                      </span>
                                    ) : <span className="text-gray-400">—</span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Registered Banks Report */}
            {activeReport === 'banks' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MICR</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IFSC</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reg. Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {banks.map((bank) => (
                      <tr key={bank.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bank.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bank.contactPerson}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bank.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bank.phone || bank.contactNo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bank.micr || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bank.ifsc || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            bank.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {bank.status}
                          </span>
                        </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bank.registrationDate ? new Date(bank.registrationDate).toLocaleDateString() : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Report Information</h4>
              <p className="text-sm text-gray-700">
                All reports are generated in real-time based on current data. You can download reports in PDF or Excel format. 
                Reports include comprehensive details and are suitable for audit and review purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
