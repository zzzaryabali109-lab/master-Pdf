import { useState } from "react";
import {
  ArrowLeft,
  Eye,
  Building2,
  Download,
  Trash2,
  Boxes,
  Plus,
  Check,
  Calendar,
  Layers,
} from "lucide-react";
import * as XLSX from "xlsx";
import type { ContainerAllocation } from "./SeparateContainersPage";
import type { ExcelRow } from "@/services/excelEngine";

interface ViewAllocationsPageProps {
  allocations: ContainerAllocation[];
  rows: ExcelRow[];
  onReleaseAllocation: (allocationId: string) => void;
  onBack: () => void;
  onGoToSeparate: () => void;
}

export default function ViewAllocationsPage({
  allocations,
  rows,
  onReleaseAllocation,
  onBack,
  onGoToSeparate,
}: ViewAllocationsPageProps) {
  const [downloadSuccessAgency, setDownloadSuccessAgency] = useState<string | null>(null);

  const totalAllocatedContainers = allocations.reduce(
    (sum, a) => sum + a.containerKeys.length,
    0
  );

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

      setDownloadSuccessAgency(allocation.agencyName);
      setTimeout(() => setDownloadSuccessAgency(null), 3000);
    } catch (err) {
      console.error("Export error:", err);
    }
  };

  return (
    <div className="w-full max-w-[97vw] xl:max-w-[1750px] mx-auto px-3 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-lg border border-border hover:bg-accent text-foreground transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title="Return to Container Table"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Table</span>
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-500" />
              Clearing Agency Allocation Records
            </h1>
            <p className="text-xs text-muted-foreground">
              Review agency allocations and export separate Excel files
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onGoToSeparate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-xs font-medium transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Separate More Containers
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-border bg-card shadow-sm text-xs">
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground font-medium">Total Agency Allocations</span>
          <span className="text-base font-semibold text-foreground">{allocations.length}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground font-medium">Total Containers Assigned</span>
          <span className="text-base font-semibold text-emerald-500 font-mono">
            {totalAllocatedContainers}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground font-medium">Export Status</span>
          <span className="text-base font-semibold text-foreground">
            {allocations.length > 0 ? "Ready for Agency Excel Export" : "No Records"}
          </span>
        </div>
      </div>

      {/* Download Alert */}
      {downloadSuccessAgency && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>Excel file exported successfully for "{downloadSuccessAgency}".</span>
        </div>
      )}

      {/* Allocations Cards or Empty State */}
      {allocations.length > 0 ? (
        <div className="flex flex-col gap-4">
          {allocations.map((alloc) => (
            <div
              key={alloc.id}
              className="p-5 rounded-xl border border-border bg-card shadow-sm flex flex-col gap-4 hover:border-border/80 transition-colors"
            >
              {/* Agency Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{alloc.agencyName}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {alloc.allocatedAt}
                      </span>
                      <span>&bull;</span>
                      <span>Batch: {alloc.batchFileName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                    {alloc.containerKeys.length} Containers
                  </span>

                  <button
                    type="button"
                    onClick={() => handleExportAgency(alloc)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-xs font-medium transition-colors cursor-pointer"
                    title="Download agency Excel file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export Excel
                  </button>

                  <button
                    type="button"
                    onClick={() => onReleaseAllocation(alloc.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Release allocation (returns containers to available pool)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Container Numbers Badge Strip */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-foreground">
                  Allocated Container Numbers ({alloc.containerNumbers.length}):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2.5 rounded-lg bg-background border border-border">
                  {alloc.containerNumbers.map((num, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-mono px-2 py-0.5 rounded bg-card border border-border text-foreground font-medium"
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>

              {/* Selected Columns */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-foreground flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                  Selected Columns for Agency Export ({alloc.selectedColumns.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {alloc.selectedColumns.map((colKey) => (
                    <span
                      key={colKey}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
                    >
                      {colKey}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full bg-card border border-border rounded-xl p-12 text-center flex flex-col items-center justify-center gap-4">
          <Boxes className="w-12 h-12 text-muted-foreground/30" />
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-foreground">
              No Container Allocations Yet
            </h3>
            <p className="text-xs text-muted-foreground max-w-md">
              You haven't separated any containers for clearing agencies yet. Use the "Separate Containers" workflow to allocate containers.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToSeparate}
            className="mt-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Boxes className="w-3.5 h-3.5" />
            Separate Containers Now
          </button>
        </div>
      )}
    </div>
  );
}
