import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '@/components/arc/button/button';
import { Badge } from '@/components/arc/badge/badge';
import {
  Settings,
  ShieldCheck,
  FileSpreadsheet,
  Building2,
  Bell,
  Save,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { currentUser, addToast } = useApp();

  const [strictLocking, setStrictLocking] = useState(true);
  const [autoEmailAgency, setAutoEmailAgency] = useState(true);
  const [defaultAllocationMethod, setDefaultAllocationMethod] = useState<'quantity' | 'manual'>('quantity');
  const [maxAllocationPerBatch, setMaxAllocationPerBatch] = useState(150);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('success', 'Settings Saved', 'System allocation configurations have been updated.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div className="pb-2 border-b border-neutral-100">
        <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
          System Settings
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Configure container allocation parameters, security safeguards, and export defaults.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Anti-Duplicate Safeguards Card */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-neutral-900">
              Allocation Security & Duplicate Protection
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start justify-between gap-4 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <div>
                <span className="font-semibold text-neutral-900 block">
                  Strict Dual-Allocation Locking
                </span>
                <p className="text-neutral-500 text-[11px] mt-0.5">
                  Prohibits any container number from being allocated to more than one agency simultaneously across all manifest batches.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge size="sm" tone="success">
                  Enforced
                </Badge>
                <input
                  type="checkbox"
                  checked={strictLocking}
                  onChange={e => setStrictLocking(e.target.checked)}
                  className="rounded border-neutral-300 text-black focus:ring-0 w-4 h-4"
                />
              </div>
            </div>

            <div className="flex items-start justify-between gap-4 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <div>
                <span className="font-semibold text-neutral-900 block">
                  Automated Agency Dispatch Notification
                </span>
                <p className="text-neutral-500 text-[11px] mt-0.5">
                  Sends an automated manifest release notification to the agency contact email upon allocation completion.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoEmailAgency}
                onChange={e => setAutoEmailAgency(e.target.checked)}
                className="rounded border-neutral-300 text-black focus:ring-0 w-4 h-4"
              />
            </div>
          </div>
        </div>

        {/* Workflow Defaults */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
            <Settings className="w-4 h-4 text-neutral-700" />
            <h3 className="text-sm font-semibold text-neutral-900">
              Allocation Defaults
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-800 mb-1">
                Default Allocation Method
              </label>
              <select
                value={defaultAllocationMethod}
                onChange={e => setDefaultAllocationMethod(e.target.value as 'quantity' | 'manual')}
                className="w-full text-xs py-2 px-3 rounded-md border border-neutral-200 bg-white"
              >
                <option value="quantity">Quantity Allocation (FIFO Auto)</option>
                <option value="manual">Manual Container Selection</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-800 mb-1">
                Maximum Batch Quota per Action
              </label>
              <input
                type="number"
                value={maxAllocationPerBatch}
                onChange={e => setMaxAllocationPerBatch(parseInt(e.target.value) || 0)}
                className="w-full text-xs py-2 px-3 rounded-md border border-neutral-200 bg-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Operator Profile */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-2xs space-y-3">
          <h3 className="text-sm font-semibold text-neutral-900 pb-2 border-b border-neutral-100">
            Authorized Operator Profile
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase font-medium block">Officer Name</span>
              <span className="font-semibold text-neutral-900">{currentUser.name}</span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 uppercase font-medium block">Clearance Role</span>
              <span className="font-medium text-neutral-800">{currentUser.role}</span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 uppercase font-medium block">Authorized ID</span>
              <span className="font-mono text-neutral-600">{currentUser.id}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            size="md"
            variant="primary"
            className="text-xs bg-black text-white hover:bg-neutral-800 px-5 h-9"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
};
