import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Menu,
  Bell,
  Search,
  Upload,
  ArrowRightLeft,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/arc/button/button';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenUploadModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, onOpenUploadModal }) => {
  const { currentPage, setCurrentPage, currentUser, containers } = useApp();

  const getPageMeta = () => {
    switch (currentPage) {
      case 'dashboard':
        return {
          title: 'Container Allocation',
          description: 'Monitor imports, allocations and clearing agency assignments.',
        };
      case 'batches':
        return {
          title: 'Import Batches',
          description: 'Upload and manage your import container sheets.',
        };
      case 'containers':
        return {
          title: 'Containers',
          description: 'View master inventory, customs details, and allocation status.',
        };
      case 'allocate':
        return {
          title: 'Allocate Containers',
          description: 'Assign available manifest containers to clearing agencies.',
        };
      case 'agencies':
        return {
          title: 'Clearing Agencies',
          description: 'Manage clearing partners, performance metrics, and container quotas.',
        };
      case 'history':
        return {
          title: 'Allocation History',
          description: 'Audit logs of historical allocations and container disbursements.',
        };
      case 'settings':
        return {
          title: 'Settings',
          description: 'Configure allocation limits, import mappings, and system parameters.',
        };
      default:
        return {
          title: 'Container Allocation',
          description: 'Maritime clearing and container management.',
        };
    }
  };

  const meta = getPageMeta();
  const availableCount = containers.filter(c => c.status === 'Available').length;

  return (
    <header className="h-16 bg-white border-b border-neutral-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 -ml-1 text-neutral-600 hover:text-neutral-900 rounded-md lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-neutral-900 tracking-tight leading-snug">
            {meta.title}
          </h1>
          <p className="hidden sm:block text-xs text-neutral-500 line-clamp-1">
            {meta.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick status indicator */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-neutral-50 rounded border border-neutral-200 text-xs">
          <span className="text-neutral-500 font-medium">Available:</span>
          <span className="font-semibold text-neutral-900">{availableCount}</span>
          <span className="text-neutral-300">|</span>
          <span className="text-emerald-700 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> 0 conflicts
          </span>
        </div>

        {/* Action Buttons */}
        {currentPage !== 'allocate' && (
          <Button
            size="sm"
            variant="secondary"
            className="hidden sm:inline-flex text-xs h-8 border border-neutral-200"
            onClick={() => setCurrentPage('allocate')}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 mr-1 text-neutral-700" />
            Allocate
          </Button>
        )}

        <Button
          size="sm"
          variant="primary"
          className="text-xs h-8 bg-black text-white hover:bg-neutral-800"
          onClick={onOpenUploadModal}
        >
          <Upload className="w-3.5 h-3.5 mr-1" />
          Upload Excel
        </Button>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-neutral-200 ml-1">
          <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-semibold">
            {currentUser.avatarInitials}
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-medium text-neutral-900 leading-tight">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-neutral-400">
              {currentUser.role}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
