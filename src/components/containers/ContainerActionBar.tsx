import { useMemo, useState } from "react";
import { Boxes, Eye, Download, Check } from "lucide-react";
import * as XLSX from "xlsx";
import type { ContainerAllocation } from "./SeparateContainersPage";
import type { ExcelRow } from "@/services/excelEngine";

interface ContainerActionBarProps {
  totalContainers: number;
  allocations: ContainerAllocation[];
  rows: ExcelRow[];
  onOpenSeparate: () => void;
  onOpenAllocations: () => void;
}

export default function ContainerActionBar({
  totalContainers,
  allocations,
  rows,
  onOpenSeparate,
  onOpenAllocations,
}: ContainerActionBarProps) {
  const [exportSelectorOpen, setExportSelectorOpen] = useState(false);
  const [downloadSuccessAgency, setDownloadSuccessAgency] = useState<string | null>(null);

  const allocatedContainerKeyCount = useMemo(() => {
    const set = new Set<string>();
    for (const alloc of allocations) {
      for (const k of alloc.containerKeys) {
        set.add(k);
      }
    }
    return set.size;
  }, [allocations]);

  const availableCount = Math.max(0, totalContainers - allocatedContainerKeyCount);

  const handleExportAgency = (allocation: ContainerAllocation) => {
    try {
      const containerKeySet = new Set(allocation.containerKeys);
      const targetRows = rows.filter((r) => containerKeySet.has(r.__id));

      const exportData = targetRows.map((r) => {
        const item: Record<string, unknown> = {};
        for (const colKey of allocation.selectedColumns) {
          item[colKey] = r[colKey] ?? "";
        }
        return item;
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      const sanitizedSheetName = allocation.agencyName
        .replace(/[\\/?*[\]]/g, "_")
        .slice(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, sanitizedSheetName || "Allocated");

      const cleanFileName = `${allocation.agencyName.replace(/[^a-zA-Z0-9_-]/g, "_")}_Containers.xlsx`;
      XLSX.writeFile(wb, cleanFileName);

      setExportSelectorOpen(false);
      setDownloadSuccessAgency(allocation.agencyName);
      setTimeout(() => setDownloadSuccessAgency(null), 3000);
    } catch (err) {
      console.error("Export error:", err);
    }
  };

  const handleExportClick = () => {
    if (allocations.length === 0) {
      alert("No containers have been allocated to any clearing agency yet.");
      return;
    }
    if (allocations.length === 1) {
      handleExportAgency(allocations[0]);
    } else {
      setExportSelectorOpen((prev) => !prev);
    }
  };

  return (
    <div className="w-full mt-4 flex flex-col gap-3">
      {downloadSuccessAgency && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>Excel file exported for "{downloadSuccessAgency}".</span>
        </div>
      )}

      {/* Main Action Bar Directly Below Existing Table */}
      <div className="w-full bg-card border border-border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        {/* Left Stats */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Container Separation & Clearing Agency Allocations
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              Total: <strong className="text-foreground">{totalContainers}</strong>
            </span>
            <span>&bull;</span>
            <span>
              Allocated:{" "}
              <strong className={allocatedContainerKeyCount > 0 ? "text-amber-500 font-semibold" : "text-foreground"}>
                {allocatedContainerKeyCount}
              </strong>
            </span>
            <span>&bull;</span>
            <span>
              Available:{" "}
              <strong className="text-emerald-500 font-semibold">{availableCount}</strong>
            </span>
          </div>
        </div>

        {/* 3 Main Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full sm:w-auto relative">
          {/* Button 1: Separate Containers (Black Primary Button) */}
          <button
            type="button"
            onClick={onOpenSeparate}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Boxes className="w-3.5 h-3.5" />
            Separate Containers
          </button>

          {/* Button 2: View Allocations */}
          <button
            type="button"
            onClick={onOpenAllocations}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border border-border bg-background hover:bg-accent text-foreground transition-colors cursor-pointer whitespace-nowrap"
          >
            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
            View Allocations
            {allocations.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
                {allocations.length}
              </span>
            )}
          </button>

          {/* Button 3: Export Agency Excel */}
          <button
            type="button"
            onClick={handleExportClick}
            disabled={allocations.length === 0}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border border-border bg-background hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed text-foreground transition-colors cursor-pointer whitespace-nowrap"
            title={allocations.length === 0 ? "Allocate containers first" : "Download agency Excel file"}
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            Export Agency Excel
          </button>

          {/* Quick Agency Export Dropdown for multiple agencies */}
          {exportSelectorOpen && allocations.length > 1 && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-lg p-2 z-40 flex flex-col gap-1 text-xs">
              <span className="px-2 py-1 text-[11px] text-muted-foreground font-medium">
                Select Agency to Download:
              </span>
              {allocations.map((alloc) => (
                <button
                  key={alloc.id}
                  type="button"
                  onClick={() => handleExportAgency(alloc)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-accent flex items-center justify-between text-foreground cursor-pointer transition-colors"
                >
                  <span className="truncate font-medium">{alloc.agencyName}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                    {alloc.containerKeys.length} cntrs
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
