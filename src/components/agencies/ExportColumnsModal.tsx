import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Dialog, DialogContent } from '@/components/arc/dialog/dialog';
import { Button } from '@/components/arc/button/button';
import { FileSpreadsheet, CheckSquare, Square } from 'lucide-react';

interface ExportColumnsModalProps {
  agencyId: string | null;
  onClose: () => void;
}

export const ExportColumnsModal: React.FC<ExportColumnsModalProps> = ({
  agencyId,
  onClose,
}) => {
  const { agencies, exportAgencyContainers } = useApp();

  const agency = agencies.find(a => a.id === agencyId);

  const [columns, setColumns] = useState<Array<{ id: string; label: string; checked: boolean }>>([
    { id: 'containerNo', label: 'Container No', checked: true },
    { id: 'blNo', label: 'BL No', checked: true },
    { id: 'vessel', label: 'Vessel', checked: true },
    { id: 'importer', label: 'Importer', checked: true },
    { id: 'eta', label: 'ETA', checked: true },
    { id: 'size', label: 'Size', checked: true },
    { id: 'weight', label: 'Weight', checked: false },
    { id: 'port', label: 'Port', checked: false },
    { id: 'shippingLine', label: 'Shipping Line', checked: false },
    { id: 'remarks', label: 'Remarks', checked: false },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);

  const toggleColumn = (id: string) => {
    setColumns(prev =>
      prev.map(c => (c.id === id ? { ...c, checked: !c.checked } : c))
    );
  };

  const handleSelectAll = (checkAll: boolean) => {
    setColumns(prev => prev.map(c => ({ ...c, checked: checkAll })));
  };

  const handleGenerate = () => {
    if (!agencyId) return;
    const selectedIds = columns.filter(c => c.checked).map(c => c.id);
    if (selectedIds.length === 0) return;

    setIsGenerating(true);
    setTimeout(() => {
      exportAgencyContainers(agencyId, selectedIds);
      setIsGenerating(false);
      onClose();
    }, 400);
  };

  if (!agencyId) return null;

  const checkedCount = columns.filter(c => c.checked).length;

  return (
    <Dialog open={!!agencyId} onOpenChange={open => !open && onClose()}>
      <DialogContent
        title="Select Excel Columns"
        description={`Customize manifest columns to include in the exported report for ${agency?.name || 'Agency'}`}
        className="max-w-md"
      >
        <div className="space-y-4 py-2 text-xs">
          <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
            <span className="text-neutral-500 font-medium">
              Columns selected: <strong className="text-neutral-900">{checkedCount} of {columns.length}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectAll(true)}
                className="text-[11px] text-neutral-600 hover:text-black hover:underline"
              >
                Select All
              </button>
              <span className="text-neutral-300">|</span>
              <button
                type="button"
                onClick={() => handleSelectAll(false)}
                className="text-[11px] text-neutral-600 hover:text-black hover:underline"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
            {columns.map(col => (
              <label
                key={col.id}
                className={`flex items-center gap-2.5 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                  col.checked
                    ? 'border-neutral-300 bg-neutral-50/80 font-medium text-neutral-900'
                    : 'border-neutral-100 bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={col.checked}
                  onChange={() => toggleColumn(col.id)}
                  className="rounded border-neutral-300 text-black focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                />
                <span>{col.label}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
            <Button
              size="sm"
              variant="secondary"
              onClick={onClose}
              disabled={isGenerating}
              className="text-xs border border-neutral-200"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              loading={isGenerating}
              disabled={checkedCount === 0 || isGenerating}
              onClick={handleGenerate}
              className="text-xs bg-black text-white hover:bg-neutral-800"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
              Generate Excel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
