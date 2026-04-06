'use client';

import { useRouter, usePathname } from 'next/navigation';
// Using a plain <img> to allow graceful fallback when logo is missing
import { authService } from '@/lib/deposits/auth';
import { User } from '@/lib/deposits/types';
import { useEffect, useRef, useState, useTransition } from 'react';

interface DepositNavigationProps {
  user: User;
}

export default function DepositNavigation({ user }: DepositNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [activeNav, setActiveNav] = useState<string>('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const handleNavigation = (path: string) => {
    setActiveNav(path);
    startTransition(() => {
      router.push(path);
    });
  };

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  const handleProfileAction = (path: string) => {
    setIsProfileMenuOpen(false);
    handleNavigation(path);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!profileMenuRef.current) {
        return;
      }

      if (!profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNavItems = () => {
    if (user.role === 'account') {
      return [
        { label: 'Dashboard', path: '/account', icon: '📊' },
        { label: 'Requirements', path: '/account/requirements', icon: '📋' },
        { label: 'Banks', path: '/account/banks', icon: '🏦' },
        { label: 'Quotes', path: '/account/quotes', icon: '💰' },
        { label: 'Reports', path: '/account/reports', icon: '📈' }
      ];
    } else if (user.role === 'bank') {
      return [
        { label: 'Dashboard', path: '/bank', icon: '📊' },
        { label: 'Requirements', path: '/bank/requirements', icon: '📋' },
        { label: 'My Quotes', path: '/bank/quotes', icon: '💰' },
        { label: 'History', path: '/bank/history', icon: '📜' }
      ];
    } else if (user.role === 'commissioner') {
      return [
        { label: 'Dashboard', path: '/commissioner', icon: '📊' },
        { label: 'Requirements', path: '/commissioner/requirements', icon: '📋' },
        { label: 'Quotes', path: '/commissioner/quotes', icon: '💰' },
        { label: 'Reports', path: '/commissioner/reports', icon: '📈' }
      ];
    }
    return [];
  };

  const navItems = getNavItems();

  return (
    <nav className="bg-white shadow-lg border-b-2 border-blue-600">
      {/* Loading Bar */}
      {(isPending || activeNav) && (
        <div className="h-1 bg-blue-600 animate-pulse"></div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* App Icon and Title */}
          <div className="flex items-center space-x-3 min-w-0">
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-linear-to-br from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg ring-2 ring-blue-100 shrink-0">
              <span aria-hidden className="text-white text-base sm:text-xl font-semibold">₹</span>
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
            </div>
            <div className="min-w-0 leading-tight">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight whitespace-nowrap truncate bg-linear-to-r from-blue-700 via-indigo-700 to-cyan-600 bg-clip-text text-transparent">
                e-Nivesh
              </h1>
              <p className="hidden sm:block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 whitespace-nowrap truncate">
                Treasury Deposit Desk
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              // Exact match for dashboard, startsWith for sub-pages
              const isDashboard = item.label === 'Dashboard';
              const isActive = isDashboard 
                ? pathname === item.path 
                : pathname === item.path || pathname?.startsWith(item.path + '/');
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  disabled={isPending}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    }
                    ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                  {isPending && activeNav === item.path && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* User Info and Profile Flyout */}
          <div className="flex items-center space-x-3" ref={profileMenuRef}>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-800">{user.name}</p>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors duration-200 flex items-center justify-center"
                aria-haspopup="menu"
                aria-expanded={isProfileMenuOpen}
                aria-label="Open profile menu"
              >
                <span className="text-lg" aria-hidden>👤</span>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50">
                  <button
                    type="button"
                    onClick={() => handleProfileAction('/profile')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProfileAction('/profile/change-password')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                  >
                    Change Password
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4 flex overflow-x-auto space-x-2">
          {navItems.map((item) => {
            // Exact match for dashboard, startsWith for sub-pages
            const isDashboard = item.label === 'Dashboard';
            const isActive = isDashboard 
              ? pathname === item.path 
              : pathname === item.path || pathname?.startsWith(item.path + '/');
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                disabled={isPending}
                className={`
                  px-3 py-2 rounded-lg font-medium whitespace-nowrap flex items-center space-x-2 text-sm
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-700 hover:bg-blue-50'
                  }
                  ${isPending ? 'opacity-50' : ''}
                `}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
