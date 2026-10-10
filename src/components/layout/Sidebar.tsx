import React from 'react';
import { useApp } from '../../context/AppContext';
import { NavigationPage } from '../../types';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Boxes,
  ArrowRightLeft,
  Building2,
  Clock,
  Settings,
  Ship,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  id: NavigationPage;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

export const Sidebar: React.FC<{ isOpen?: boolean; onCloseMobile?: () => void }> = ({
  isOpen = true,
  onCloseMobile,
}) => {
  const { currentPage, setCurrentPage, containers } = useApp();

  const availableCount = containers.filter(c => c.status === 'Available').length;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'batches', label: 'Import Batches', icon: FileSpreadsheet },
    { id: 'containers', label: 'Containers', icon: Boxes, badge: containers.length },
    { id: 'allocate', label: 'Allocate Containers', icon: ArrowRightLeft, badge: availableCount },
    { id: 'agencies', label: 'Agencies', icon: Building2 },
    { id: 'history', label: 'Allocation History', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelect = (page: NavigationPage) => {
    setCurrentPage(page);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside
      className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-neutral-200 flex flex-col transition-transform duration-200 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-neutral-100">
        <div className="w-9 h-9 rounded-md bg-black text-white flex items-center justify-center shadow-xs">
          <Ship className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight text-neutral-900 leading-tight">
            PortOps Allocation
          </div>
          <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
            Agency Management
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
          Main Workspace
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-colors text-left group ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-700'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-neutral-800 text-neutral-200'
                      : item.id === 'allocate'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Security & Verification Card */}
      <div className="p-3 border-t border-neutral-100">
        <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200/60 text-xs">
          <div className="flex items-center gap-2 font-medium text-neutral-900 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Anti-Duplicate Guard</span>
          </div>
          <p className="text-[11px] text-neutral-500 leading-relaxed">
            Strict allocation locks prevent any container from dual-assignment.
          </p>
        </div>
      </div>

      {/* Compact System Footer */}
      <div className="p-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
        <span>Manifest v3.4.1</span>
        <span className="flex items-center gap-1 text-emerald-600 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
          Operational
        </span>
      </div>
    </aside>
  );
};
