'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/deposits/auth';
import { User } from '@/lib/deposits/types';
import { mockApi } from '@/lib/deposits';
import DepositNavigation from '@/components/deposits/DepositNavigation';
import { ButtonLoader } from '@/components/deposits/LoadingSpinner';
import { formatAmountPreview } from '@/lib/deposits/formatters';

export default function CreateRequirementPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    schemeName: '',
    depositType: 'non-callable' as 'callable' | 'non-callable',
    amount: '',
    depositPeriod: '',
    validityPeriod: '',
    description: ''
  });

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'account') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        depositPeriod: parseInt(formData.depositPeriod),
        createdBy: user?.id
      };
      
      console.log('Creating requirement with payload:', payload);
      
      await mockApi.createRequirement(payload);

      alert('Requirement created successfully!');
      router.push('/account/requirements');
    } catch (error) {
      alert('Error creating requirement');
      console.error('Create requirement error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <DepositNavigation user={user} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Deposit Requirement</h1>
          <p className="text-gray-600 mt-2">Fill in the details for the new deposit requirement</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Scheme Name *
            </label>
            <input
              type="text"
              required
              value={formData.schemeName}
              onChange={(e) => setFormData({...formData, schemeName: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              placeholder="e.g., Fixed Deposit Scheme 2025-Q1"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Deposit Type *
              </label>
              <select
                required
                value={formData.depositType}
                onChange={(e) => setFormData({...formData, depositType: e.target.value as any})}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              >
                <option value="non-callable">Non-Callable</option>
                <option value="callable">Callable</option>
              </select>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Amount (₹) *
                </label>
                {formData.amount && formatAmountPreview(formData.amount) && (
                  <span className="text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                    {formatAmountPreview(formData.amount)}
                  </span>
                )}
              </div>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                placeholder="e.g., 35000000"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Deposit Period (Months) *
              </label>
              <input
                type="number"
                required
                value={formData.depositPeriod}
                onChange={(e) => setFormData({...formData, depositPeriod: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                placeholder="e.g., 12"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Validity Period *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.validityPeriod}
                onChange={(e) => setFormData({...formData, validityPeriod: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              placeholder="Enter additional details about this requirement..."
            />
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
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Requirement</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
