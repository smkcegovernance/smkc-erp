'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authService } from '@/lib/deposits/auth';
import { User, DepositRequirement, BankQuote } from '@/lib/deposits/types';
import { formatAmount } from '@/lib/deposits/formatters';
import { depositApi } from '@/lib/deposits/api';
import DepositNavigation from '@/components/deposits/DepositNavigation';
import LoadingSpinner, { PageLoader, ButtonLoader } from '@/components/deposits/LoadingSpinner';

export default function BankRequirementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requirementId = params?.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [requirement, setRequirement] = useState<DepositRequirement | null>(null);
  const [existingQuote, setExistingQuote] = useState<BankQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [consentFile, setConsentFile] = useState<File | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [formData, setFormData] = useState({
    interestRate: '',
    remarks: ''
  });

  const formatSubmittedAt = (value?: string | null) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
  };

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'bank') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadData(currentUser);
  }, [router, requirementId]);

  const loadData = async (user: User) => {
    try {
      console.log('Loading data for user:', { userId: user.id, bankId: user.bankId, role: user.role });
      console.log('Calling getQuotes with:', { role: 'bank', requirementId, bankId: user.bankId });
      
      const [reqData, quotesData] = await Promise.all([
        depositApi.getRequirement(requirementId, 'bank'),
        depositApi.getQuotes('bank', requirementId, user.bankId)
      ]);
      
      console.log('Loaded requirement:', reqData);
      console.log('Loaded quotes:', quotesData);
      
      setRequirement(reqData);
      if (quotesData.length > 0) {
        setExistingQuote(quotesData[0]);
        setFormData({
          interestRate: quotesData[0].interestRate.toString(),
          remarks: quotesData[0].remarks || ''
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert(`Failed to load requirement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !requirement) return;

    if (!consentFile) {
      alert('Please upload consent document from authorized person');
      return;
    }

    setIsSubmitting(true);
    try {
      let consentDocument = undefined;
      
      if (consentFile) {
        // Convert file to base64
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(consentFile);
        });

        // Upload consent via plain FTP-backed endpoint (no auth required)
        const rawBase64 = (base64Data || '').replace(/^data:[^;]+;base64,/i, '');
        const uploadPayload = {
          requirementId: requirement.id,
          bankId: (user.bankId || user.id),
          fileName: consentFile.name,
          fileData: rawBase64,
          fileSize: consentFile.size,
          contentType: consentFile.type || undefined,
        };

        const uploadRes = await fetch('/depositmanager/api/proxy/consent/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(uploadPayload),
        });

        const uploadCt = uploadRes.headers.get('content-type') || '';
        let uploadJson: any = null;
        if (uploadCt.includes('application/json')) {
          uploadJson = await uploadRes.json();
          console.log('[BankRequirement] Consent upload response', uploadJson);
        } else {
          const uploadText = await uploadRes.text();
          console.warn('[BankRequirement] Consent upload non-JSON response', { status: uploadRes.status, text: uploadText });
          throw new Error('Consent upload failed: non-JSON response');
        }

        const uploadSuccess = uploadJson?.success === true || uploadJson?.Success === true;
        const uploadMessage = uploadJson?.message || uploadJson?.Message || 'Consent upload failed';
        if (!uploadRes.ok || !uploadSuccess) {
          throw new Error(String(uploadMessage));
        }

        // Use actual stored filename returned by upload API so submit points to the uploaded file.
        const uploadedFileName = uploadJson?.data?.fileName || uploadJson?.Data?.fileName || consentFile.name;
        consentDocument = {
          fileName: uploadedFileName
        } as any;
      }

      await depositApi.submitQuote({
        requirementId: requirement.id,
        bankId: (user.bankId || user.id),
        interestRate: parseFloat(formData.interestRate),
        remarks: formData.remarks,
        consentDocument: consentDocument
      });

      alert('Quote submitted successfully!');
      router.push('/bank/quotes');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error submitting quote';
      alert(message);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || loading) {
    return <PageLoader />;
  }

  if (!requirement) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DepositNavigation user={user} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-xl text-gray-600">Requirement not found</p>
          </div>
        </div>
      </div>
    );
  }

  const isExpired = new Date(requirement.validityPeriod) < new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      <DepositNavigation user={user} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.back()}
          className="mb-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back</span>
        </button>

        {/* Requirement Details */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{requirement.schemeName}</h1>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              isExpired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {isExpired ? 'EXPIRED' : 'ACTIVE'}
            </span>
          </div>

          {requirement.description && (
            <p className="text-gray-600 mb-6">{requirement.description}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Deposit Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatAmount(requirement.amount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Deposit Period</p>
              <p className="text-2xl font-bold text-gray-900">{requirement.depositPeriod} Months</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Deposit Type</p>
              <p className="text-2xl font-bold text-gray-900 capitalize">{requirement.depositType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Valid Until</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(requirement.validityPeriod).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Published Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(requirement.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Existing Quote or Submit Form */}
        {existingQuote ? (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Submitted Quote</h2>
            <div className="grid grid-cols-2 gap-6 mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Interest Rate Offered</p>
                <p className="text-3xl font-bold text-blue-600">{existingQuote.interestRate}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Submitted On</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatSubmittedAt(existingQuote.submittedAt)}
                </p>
              </div>
            </div>
            {existingQuote.remarks && (
              <div className="p-4 bg-white rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-1">Your Remarks:</p>
                <p className="text-gray-600">{existingQuote.remarks}</p>
              </div>
            )}
            {existingQuote.consentFileName && (
              <div className="p-4 bg-white rounded-lg border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Consent Document</p>
                      <p className="text-sm text-gray-600">{existingQuote.consentFileName}</p>
                      <p className="text-xs text-gray-500">
                        {existingQuote.consentFileSize || existingQuote.consentUploadedAt
                          ? `${existingQuote.consentFileSize ? `${(existingQuote.consentFileSize / 1024).toFixed(1)} KB` : 'Size unavailable'}${existingQuote.consentUploadedAt ? ` • Uploaded ${new Date(existingQuote.consentUploadedAt).toLocaleString()}` : ''}`
                          : 'File size and upload time unavailable'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!user || !existingQuote) return;
                      try {
                        setDownloading(true);
                        const url = `/api/proxy/consent/download?requirementId=${encodeURIComponent(String(existingQuote.requirementId || ''))}&bankId=${encodeURIComponent(String((user.bankId || user.userId || '')))}&fileName=${encodeURIComponent(String(existingQuote.consentFileName || 'consent-document.pdf'))}`;
                        const res = await fetch(url);
                        const ct = res.headers.get('content-type') || '';
                        if (!res.ok) throw new Error(`Download failed (${res.status})`);

                        if (ct.includes('application/json')) {
                          const result = await res.json();
                          const data = result?.data || result;
                          const a = document.createElement('a');
                          a.href = `data:${data.contentType};base64,${data.fileData}`;
                          a.download = data.fileName || existingQuote.consentFileName || 'consent-document';
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                        } else {
                          const blob = await res.blob();
                          const a = document.createElement('a');
                          a.href = URL.createObjectURL(blob);
                          a.download = existingQuote.consentFileName || 'consent-document.pdf';
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          setTimeout(() => URL.revokeObjectURL(a.href), 0);
                        }
                      } catch (e: any) {
                        console.error('Failed to download consent document', {
                          error: e,
                          message: e?.message,
                          stack: e?.stack,
                        });
                        alert(`Failed to download consent document${e?.message ? ': ' + e.message : ''}`);
                      } finally {
                        setDownloading(false);
                      }
                    }}
                    disabled={downloading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{downloading ? 'Downloading...' : 'Download'}</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        ) : (
          <>
            {!isExpired && (
              <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Submit Your Quote
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Interest Rate (% per annum) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.interestRate}
                      onChange={(e) => setFormData({...formData, interestRate: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-2xl font-bold text-blue-600"
                      placeholder="e.g., 7.50"
                    />
                    <p className="text-sm text-gray-500 mt-1">Enter the annual interest rate you're offering</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Remarks (Optional)
                    </label>
                    <textarea
                      rows={4}
                      value={formData.remarks}
                      onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                      placeholder="Add any additional terms or conditions..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Consent Document from Authorized Person *
                    </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                        <input
                          type="file"
                          id="consent-file"
                          accept=".pdf,.jpg,.jpeg"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Validate file type
                              const fileType = file.type.toLowerCase();
                              const fileName = file.name.toLowerCase();
                              const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];
                              const validExtensions = ['.pdf', '.jpg', '.jpeg'];
                              const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
                              
                              if (!validTypes.includes(fileType) && !hasValidExtension) {
                                alert('Only PDF and JPG files are allowed');
                                e.target.value = '';
                                setConsentFile(null);
                                return;
                              }
                              if (file.size > 5 * 1024 * 1024) {
                                alert('File size should not exceed 5MB');
                                e.target.value = '';
                                setConsentFile(null);
                                return;
                              }
                              setConsentFile(file);
                            }
                          }}
                          className="hidden"
                          required
                        />
                        <label htmlFor="consent-file" className="cursor-pointer">
                          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          {consentFile ? (
                            <div className="text-sm">
                              <p className="font-semibold text-green-600">✓ {consentFile.name}</p>
                              <p className="text-gray-500">({(consentFile.size / 1024).toFixed(2)} KB)</p>
                            </div>
                          ) : (
                            <div className="text-sm">
                              <p className="font-semibold text-blue-600">Click to upload consent document</p>
                              <p className="text-gray-500">PDF or JPG only (Max 5MB)</p>
                            </div>
                          )}
                        </label>
                      </div>
                    <p className="text-xs text-gray-500 mt-2">
                      * Upload authorization letter/consent from bank's authorized signatory
                    </p>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-colors shadow-md flex items-center justify-center space-x-2"
                    >
                      {isSubmitting ? (
                        <>
                          <ButtonLoader />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <span>Submit Quote</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            {isExpired && !existingQuote && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
                <svg className="w-16 h-16 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Requirement Expired</h3>
                <p className="text-gray-600">The validity period for this requirement has passed. You can no longer submit quotes.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
