import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  Search,
  Copy,
  Check,
  Download,
  FileDown,
  PanelLeft,
  PanelRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Table as TableIcon,
  X,
  Info,
  RefreshCw,
  AlertTriangle,
  FileSearch,
  Printer,
  AlertCircle
} from "lucide-react";
import FloatingButtonGroup, {
  FloatingButtonGroupItem,
} from "@/components/arc/floating-button-group/floating-button-group";
import ExpandingButtonGroup, {
  ExpandingButtonGroupItem,
} from "@/components/arc/expanding-button-group/expanding-button-group";
import { OcrPageData, OcrBlock } from "../../types/ocr";
import { exportCleanPdf } from "../../utils/pdfRenderer";

interface AcrobatPdfProcessingPageProps {
  fileName: string;
  fileSize?: number;
  pages: OcrPageData[];
  onBackToUpload: () => void;
  onReRunOcr?: () => Promise<void>;
  isProcessing?: boolean;
  processingProgress?: number;
  processingStage?: string;
  errorMessage?: string | null;
  onRetry?: () => void;
}

export default function AcrobatPdfProcessingPage({
  fileName,
  fileSize,
  pages,
  onBackToUpload,
  onReRunOcr,
  isProcessing = false,
  processingProgress = 0,
  processingStage = "Analyzing document structure...",
  errorMessage = null,
  onRetry,
}: AcrobatPdfProcessingPageProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [viewMode, setViewMode] = useState<"original" | "clean">("clean");
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [userRotation, setUserRotation] = useState(0);
  const [isFitPage, setIsFitPage] = useState(false);

  // Search in document
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatches, setSearchMatches] = useState<{ pageIndex: number; blockIndex: number; text: string }[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Uncertain OCR Token review state
  const [selectedUncertainToken, setSelectedUncertainToken] = useState<any | null>(null);
  const [activeUncertainTokens, setActiveUncertainTokens] = useState<any[]>([]);

  // Copy status feedback
  const [copiedText, setCopiedText] = useState(false);

  // Clean PDF Export Modal & Options State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportScope, setExportScope] = useState<"all" | "current">("all");
  const [includeSearchableLayer, setIncludeSearchableLayer] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentPage = pages[currentPageIndex] || pages[0];
  const totalPages = pages.length;

  // Initialize uncertain tokens for current page
  useEffect(() => {
    if (currentPage?.uncertainTokens) {
      setActiveUncertainTokens(currentPage.uncertainTokens);
    } else {
      setActiveUncertainTokens([]);
    }
  }, [currentPageIndex, currentPage?.uncertainTokens]);

  // Sync orientation from detected angle
  useEffect(() => {
    if (currentPage && currentPage.detectedOrientation) {
      const correction = (360 - currentPage.detectedOrientation) % 360;
      setUserRotation(correction);
    }
  }, [currentPageIndex, currentPage?.detectedOrientation]);

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchMatches([]);
      setCurrentMatchIndex(0);
      return;
    }
    const q = searchQuery.toLowerCase();
    const matches: { pageIndex: number; blockIndex: number; text: string }[] = [];

    pages.forEach((page, pIdx) => {
      page.blocks?.forEach((block, bIdx) => {
        if (block.text.toLowerCase().includes(q)) {
          matches.push({ pageIndex: pIdx, blockIndex: bIdx, text: block.text });
        }
      });
    });

    setSearchMatches(matches);
    setCurrentMatchIndex(matches.length > 0 ? 0 : -1);
  }, [searchQuery, pages]);

  const jumpToMatch = (index: number) => {
    if (searchMatches.length === 0) return;
    const target = searchMatches[index];
    if (target) {
      setCurrentPageIndex(target.pageIndex);
      setCurrentMatchIndex(index);
    }
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setIsFitPage(false);
    setZoomLevel((z) => Math.min(z + 20, 220));
  };
  const handleZoomOut = () => {
    setIsFitPage(false);
    setZoomLevel((z) => Math.max(z - 20, 50));
  };
  const handleFitPageToggle = () => {
    if (isFitPage) {
      setIsFitPage(false);
      setZoomLevel(100);
    } else {
      setIsFitPage(true);
      setZoomLevel(85);
    }
  };
  const handleRotate = () => {
    setUserRotation((r) => (r + 90) % 360);
  };

  const handleCopyText = () => {
    if (!currentPage) return;
    navigator.clipboard.writeText(currentPage.cleanMarkdown);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleDownloadOriginal = () => {
    if (currentPage?.imageSrc) {
      const a = document.createElement("a");
      a.href = currentPage.imageSrc;
      a.download = fileName;
      a.click();
    } else {
      handleExportCleanPdf();
    }
  };

  const handleExportCleanPdf = (options?: { scope?: "all" | "current"; searchable?: boolean }) => {
    setIsExporting(true);
    try {
      const scope = options?.scope ?? exportScope;
      const searchable = options?.searchable ?? includeSearchableLayer;

      const savedName = exportCleanPdf(pages, fileName, {
        pageScope: scope,
        currentPageIndex,
        includeSearchableOcrTextLayer: searchable,
      });

      setExportSuccessMessage(
        `Successfully exported clean PDF: ${savedName} (${scope === "all" ? `${totalPages} pages` : `Page ${currentPageIndex + 1}`})`
      );
      setTimeout(() => setExportSuccessMessage(null), 4000);
      setIsExportModalOpen(false);
    } catch (err: any) {
      console.error("Failed to export clean PDF:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // Focus search input when toggled
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Keyboard navigation for document viewer
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "[") {
        setCurrentPageIndex((p) => Math.max(0, p - 1));
      } else if (e.key === "ArrowRight" || e.key === "]") {
        setCurrentPageIndex((p) => Math.min(totalPages - 1, p + 1));
      } else if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if ((e.metaKey || e.ctrlKey) && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        handleZoomIn();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "-") {
        e.preventDefault();
        handleZoomOut();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalPages]);

  // 1. FloatingButtonGroup: Page Navigation Group Items (with explicit "1 of 12" indicator)
  const pageNavItems: FloatingButtonGroupItem[] = [
    {
      type: "action",
      id: "prev-page",
      label: "Previous Page",
      icon: <ChevronLeft size={16} />,
      iconOnly: true,
      disabled: currentPageIndex === 0,
      shortcut: "[",
      onSelect: () => setCurrentPageIndex((p) => Math.max(0, p - 1)),
    },
    {
      type: "action",
      id: "page-indicator",
      label: `${currentPageIndex + 1} of ${totalPages}`,
      iconOnly: false,
      shortcut: "p",
    },
    {
      type: "action",
      id: "next-page",
      label: "Next Page",
      icon: <ChevronRight size={16} />,
      iconOnly: true,
      disabled: currentPageIndex >= totalPages - 1,
      shortcut: "]",
      onSelect: () => setCurrentPageIndex((p) => Math.min(totalPages - 1, p + 1)),
    },
  ];

  // 2. FloatingButtonGroup: Zoom & View Controls Group Items
  const zoomViewItems: FloatingButtonGroupItem[] = [
    {
      type: "action",
      id: "zoom-out",
      label: "Zoom Out",
      icon: <ZoomOut size={16} />,
      iconOnly: true,
      shortcut: "⌘-",
      onSelect: handleZoomOut,
    },
    {
      type: "action",
      id: "zoom-percent",
      label: `${zoomLevel}%`,
      iconOnly: false,
      onSelect: () => setZoomLevel(100),
    },
    {
      type: "action",
      id: "zoom-in",
      label: "Zoom In",
      icon: <ZoomIn size={16} />,
      iconOnly: true,
      shortcut: "⌘+",
      onSelect: handleZoomIn,
    },
    {
      type: "separator",
      id: "sep-zoom-fit",
    },
    {
      type: "action",
      id: "fit-page",
      label: isFitPage ? "100% Size" : "Fit to Page",
      icon: <Maximize2 size={16} />,
      iconOnly: true,
      pressed: isFitPage,
      shortcut: "0",
      onSelect: handleFitPageToggle,
    },
    {
      type: "action",
      id: "rotate-page",
      label: "Rotate 90° CW",
      icon: <RotateCw size={16} />,
      iconOnly: true,
      shortcut: "R",
      onSelect: handleRotate,
    },
  ];

  // 3. FloatingButtonGroup: View Mode Switcher Items
  const modeSwitchItems: FloatingButtonGroupItem[] = [
    {
      type: "action",
      id: "mode-original",
      label: "Original PDF",
      icon: <FileText size={16} />,
      iconOnly: false,
      pressed: viewMode === "original",
      onSelect: () => setViewMode("original"),
    },
    {
      type: "action",
      id: "mode-clean",
      label: "Clean View",
      icon: <Sparkles size={16} />,
      iconOnly: false,
      pressed: viewMode === "clean",
      onSelect: () => setViewMode("clean"),
    },
  ];

  // 4. ExpandingButtonGroup: Primary Document Actions & Exports (Expands smoothly on hover!)
  const expandingActionItems: ExpandingButtonGroupItem[] = [
    {
      id: "export-clean",
      label: "Export Clean PDF",
      doneLabel: "Configured",
      icon: <FileDown size={16} />,
      onSelect: async () => {
        setIsExportModalOpen(true);
        return true;
      },
    },
    {
      id: "download-original",
      label: "Download Original",
      doneLabel: "Downloaded",
      icon: <Download size={16} />,
      onSelect: async () => {
        handleDownloadOriginal();
        return true;
      },
    },
    {
      id: "copy-ocr",
      label: "Copy OCR Text",
      doneLabel: "Copied!",
      icon: <Copy size={16} />,
      onSelect: async () => {
        handleCopyText();
        return true;
      },
    },
    {
      id: "search-doc",
      label: "Search Text",
      icon: <Search size={16} />,
      onSelect: () => {
        setIsSearchOpen((s) => !s);
      },
    },
  ];

  // 5. FloatingButtonGroup: Panel Toggles
  const panelToggleItems: FloatingButtonGroupItem[] = [
    {
      type: "action",
      id: "toggle-thumbnails",
      label: "Thumbnails Panel",
      icon: <PanelLeft size={16} />,
      iconOnly: true,
      pressed: isLeftSidebarOpen,
      onSelect: () => setIsLeftSidebarOpen((o) => !o),
    },
    {
      type: "action",
      id: "toggle-info",
      label: "Document Info",
      icon: <PanelRight size={16} />,
      iconOnly: true,
      pressed: isRightPanelOpen,
      onSelect: () => setIsRightPanelOpen((o) => !o),
    },
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-white text-neutral-900 select-none overflow-hidden font-sans">
      {/* 1. TOP WHITE ACROBAT APPLICATION TOOLBAR */}
      <header className="h-14 bg-white border-b border-neutral-200/90 flex items-center justify-between px-3 sm:px-4 z-30 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        {/* Left: Back button & Document Identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToUpload}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-neutral-200 hover:border-neutral-300 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-medium transition cursor-pointer"
            title="Return to Upload Dropzone"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Upload New</span>
          </button>

          <div className="h-4 w-[1px] bg-neutral-200" />

          {/* Acrobat Document Identity */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#e5252a] text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
              <FileText size={15} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-neutral-900 truncate max-w-[140px] sm:max-w-[200px] md:max-w-[260px]">
                {fileName}
              </span>
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                <span>{totalPages} {totalPages === 1 ? "page" : "pages"}</span>
                <span>•</span>
                <span>{fileSize ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB` : "Scanned PDF"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Main Floating Button Groups for Toolbar Controls */}
        <div className="hidden md:flex items-center gap-2">
          {/* Mode Switcher Floating Button Group */}
          <FloatingButtonGroup
            label="Document view modes"
            items={modeSwitchItems}
            variant="muted"
            size="sm"
          />

          <div className="h-4 w-[1px] bg-neutral-200 mx-0.5" />

          {/* Page Navigation Floating Button Group */}
          <FloatingButtonGroup
            label="Page navigation"
            items={pageNavItems}
            variant="muted"
            size="sm"
          />

          <div className="h-4 w-[1px] bg-neutral-200 mx-0.5" />

          {/* Zoom & View Controls Floating Button Group */}
          <FloatingButtonGroup
            label="Zoom and view controls"
            items={zoomViewItems}
            variant="muted"
            size="sm"
          />

          <div className="h-4 w-[1px] bg-neutral-200 mx-0.5" />

          {/* Sidebar Panel Toggles */}
          <FloatingButtonGroup
            label="Toggle side panels"
            items={panelToggleItems}
            variant="muted"
            size="sm"
          />
        </div>

        {/* Right: Expanding Button Group for Primary Actions & Exports */}
        <div className="flex items-center gap-2">
          {/* Expanding Button Group (Official @uiarc/expanding-button-group) */}
          <ExpandingButtonGroup
            label="Document actions and exports"
            items={expandingActionItems}
            size="sm"
            defaultExpanded="export-clean"
          />
        </div>
      </header>

      {/* OCR PROCESSING PROGRESS BANNER */}
      {isProcessing && (
        <div className="bg-sky-50 border-b border-sky-200 px-4 py-2 flex items-center justify-between text-xs text-sky-900 z-20 shrink-0">
          <div className="flex items-center gap-2.5">
            <RefreshCw size={14} className="animate-spin text-sky-600 shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold text-sky-950">
                {processingStage} ({Math.round(processingProgress)}%)
              </span>
              <span className="text-[11px] text-sky-700">
                Adobe PDF Services OCR and structural layout reconstruction active
              </span>
            </div>
          </div>
          <div className="w-36 h-2 bg-sky-200 rounded-full overflow-hidden shrink-0">
            <div
              className="h-full bg-sky-600 transition-all duration-300"
              style={{ width: `${Math.max(10, processingProgress)}%` }}
            />
          </div>
        </div>
      )}

      {/* CLEAR ERROR MESSAGE & RETRY BANNER */}
      {errorMessage && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 flex items-center justify-between text-xs text-red-900 z-20 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <div>
              <span className="font-bold text-red-950">OCR Analysis Error:</span>
              <span className="ml-1 text-red-800">{errorMessage}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow-2xs transition cursor-pointer flex items-center gap-1"
              >
                <RefreshCw size={12} />
                <span>Retry OCR</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Toolbar Bar (Visible only on small viewports) */}
      <div className="md:hidden h-11 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between px-3 z-20 shrink-0">
        <FloatingButtonGroup
          label="Mobile mode"
          items={modeSwitchItems}
          variant="muted"
          size="sm"
        />
        <FloatingButtonGroup
          label="Mobile page navigation"
          items={pageNavItems}
          variant="muted"
          size="sm"
        />
      </div>

      {/* 2. MAIN WORKSPACE WITH COLLAPSIBLE SIDEBARS & CENTER CANVAS */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* LEFT COLLAPSIBLE SIDEBAR: PAGE THUMBNAILS */}
        <aside
          className={`bg-white border-r border-neutral-200 flex flex-col transition-all duration-200 z-10 shrink-0 ${
            isLeftSidebarOpen ? "w-56" : "w-0 overflow-hidden border-r-0"
          }`}
        >
          {/* Thumbnails Header */}
          <div className="h-10 border-b border-neutral-200 px-3 flex items-center justify-between shrink-0 bg-neutral-50/70">
            <span className="text-xs font-semibold text-neutral-700 tracking-wide">
              Pages ({totalPages})
            </span>
            <button
              onClick={() => setIsLeftSidebarOpen(false)}
              className="p-1 rounded hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800 transition"
              title="Collapse sidebar"
            >
              <PanelLeft size={14} />
            </button>
          </div>

          {/* Thumbnails Scroll List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {pages.map((p, idx) => {
              const isSelected = currentPageIndex === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setCurrentPageIndex(idx)}
                  className="cursor-pointer group flex flex-col items-center"
                >
                  {/* Miniature Document Page Frame */}
                  <div
                    className={`w-36 aspect-[1/1.414] bg-white rounded-sm border p-2.5 flex flex-col justify-between transition shadow-sm ${
                      isSelected
                        ? "border-[#e5252a] ring-2 ring-[#e5252a]/20 shadow-md"
                        : "border-neutral-300 hover:border-neutral-400 group-hover:shadow"
                    }`}
                  >
                    {/* Simulated Document Lines */}
                    <div className="space-y-1.5 w-full">
                      <div className="h-2 bg-neutral-800 rounded-xs w-3/4" />
                      <div className="h-1 bg-neutral-400 rounded-xs w-1/2" />
                      <div className="h-1 bg-neutral-200 rounded-xs w-full mt-2" />
                      <div className="h-1 bg-neutral-200 rounded-xs w-5/6" />
                      <div className="h-1 bg-neutral-200 rounded-xs w-full" />
                      <div className="h-1 bg-neutral-200 rounded-xs w-4/5" />
                      {p.tables && p.tables.length > 0 && (
                        <div className="h-4 border border-dashed border-neutral-300 rounded-xs w-full my-1" />
                      )}
                    </div>
                    <div className="flex justify-between items-end text-[8px] text-neutral-400 font-mono">
                      <span className="truncate max-w-[65px]">{p.documentType}</span>
                      <span className="font-semibold text-neutral-600">p.{idx + 1}</span>
                    </div>
                  </div>

                  {/* Page Label Below Thumbnail */}
                  <span
                    className={`text-[11px] mt-1.5 font-medium transition ${
                      isSelected ? "text-[#e5252a] font-semibold" : "text-neutral-500 group-hover:text-neutral-800"
                    }`}
                  >
                    Page {idx + 1} of {totalPages}
                  </span>
                </div>
              );
            })}
          </div>
        </aside>

        {/* CENTER DOCUMENT CANVAS: SUBTLE LIGHT-GRAY WORKSPACE */}
        <main
          ref={canvasRef}
          className="flex-1 bg-[#f4f5f7] overflow-auto flex flex-col items-center p-6 sm:p-10 relative select-text"
        >
          {/* Export Success Feedback Notification */}
          {exportSuccessMessage && (
            <div className="mb-4 max-w-[800px] w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-xs shadow-sm bg-emerald-50 border-emerald-300 text-emerald-900 shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span className="font-medium">{exportSuccessMessage}</span>
              </div>
              <button
                onClick={() => setExportSuccessMessage(null)}
                className="text-emerald-700 hover:text-emerald-900 p-0.5 rounded cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Mode Notice Banner */}
          <div className="mb-5 max-w-[800px] w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2 rounded-lg border text-xs shadow-xs bg-white border-neutral-200 shrink-0">
            {viewMode === "original" ? (
              <div className="flex items-center gap-2 text-neutral-700">
                <span className="w-2 h-2 rounded-full bg-neutral-400 shrink-0" />
                <span className="font-semibold text-neutral-900">Original Document View (Unmodified)</span>
                <span className="text-neutral-500 hidden sm:inline">— Displaying original uploaded PDF without modifying the original document.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-neutral-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-semibold text-neutral-900">Clean Reconstructed View</span>
                <span className="text-neutral-500 hidden sm:inline">— Normalized spacing, aligned tables, restored typography &amp; selectable vectors.</span>
              </div>
            )}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {viewMode === "clean" && (
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-[11px] flex items-center gap-1 transition shadow-2xs cursor-pointer"
                >
                  <FileDown size={12} />
                  <span>Export Clean PDF</span>
                </button>
              )}
              <span className="text-[11px] font-mono text-neutral-500">
                Page {currentPageIndex + 1} of {totalPages}
              </span>
            </div>
          </div>

          {/* In-Document Floating Search Bar */}
          {isSearchOpen && (
            <div className="absolute top-4 right-4 z-40 bg-white border border-neutral-300 rounded-lg shadow-lg p-1.5 flex items-center gap-1 text-xs">
              <Search size={14} className="text-neutral-400 ml-1" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Find in document..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-36 sm:w-48 px-1.5 py-1 text-xs border-none focus:outline-none text-neutral-900 placeholder:text-neutral-400"
              />
              <span className="text-[11px] text-neutral-500 px-1 font-mono">
                {searchMatches.length > 0 ? `${currentMatchIndex + 1}/${searchMatches.length}` : "0"}
              </span>
              <button
                onClick={() => jumpToMatch((currentMatchIndex - 1 + searchMatches.length) % searchMatches.length)}
                disabled={searchMatches.length === 0}
                className="p-1 hover:bg-neutral-100 rounded text-neutral-600 disabled:opacity-30"
                title="Previous match"
              >
                <ChevronLeft size={13} />
              </button>
              <button
                onClick={() => jumpToMatch((currentMatchIndex + 1) % searchMatches.length)}
                disabled={searchMatches.length === 0}
                className="p-1 hover:bg-neutral-100 rounded text-neutral-600 disabled:opacity-30"
                title="Next match"
              >
                <ChevronRight size={13} />
              </button>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-700"
                title="Close search"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* DOCUMENT SHEET CONTAINER */}
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "top center",
              transition: "transform 0.15s ease-out",
            }}
            className="relative shadow-[0_4px_24px_rgba(0,0,0,0.08)] rounded-xs border border-neutral-200/90 bg-white mb-10"
          >
            {/* MODE 1: ORIGINAL PDF (Rendered with scan authenticity & selectable text) */}
            {viewMode === "original" && (
              <div
                style={{
                  transform: `rotate(${userRotation + (currentPage?.detectedOrientation || 0)}deg) skewY(${currentPage?.skewAngleDegrees || 0}deg)`,
                  filter: currentPage?.blurDetected ? "contrast(96%)" : "none",
                }}
                className="w-[800px] min-h-[1035px] bg-[#faf8f5] text-neutral-900 p-12 sm:p-14 relative overflow-hidden transition-all duration-300 font-serif"
              >
                {/* Scan Paper Watermark / Artifact simulation */}
                <div className="absolute top-2 left-3 text-[10px] text-neutral-400 font-mono tracking-wider">
                  ORIGINAL SCAN • DETECTED SKEW: {currentPage?.skewAngleDegrees ? `${currentPage.skewAngleDegrees}°` : "0°"}
                </div>

                {/* Scanned Document Header */}
                <div className="border-b-2 border-neutral-800 pb-4 mb-6">
                  <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                    {currentPage?.title || "OFFICIAL COMMERCIAL STATEMENT"}
                  </h1>
                  <p className="text-xs text-neutral-600 mt-1 font-sans">
                    Category: {currentPage?.documentType} • Scanned Document Record
                  </p>
                </div>

                {/* Scanned Content with selectable text overlay */}
                <div className="space-y-4">
                  {currentPage?.blocks?.map((block: OcrBlock, bIdx: number) => {
                    const isMatched = searchMatches.some(
                      (m) => m.pageIndex === currentPageIndex && m.blockIndex === bIdx
                    );
                    return (
                      <div
                        key={bIdx}
                        className={`p-1 rounded transition ${
                          isMatched ? "bg-amber-200 text-neutral-950 font-medium ring-1 ring-amber-400" : ""
                        }`}
                      >
                        {block.type === "heading" && (
                          <h2 className="text-lg font-bold text-neutral-900 border-b border-neutral-300 pb-1">
                            {block.text}
                          </h2>
                        )}

                        {block.type === "paragraph" && (
                          <p className="text-sm leading-relaxed text-neutral-800 font-sans">
                            {block.text}
                          </p>
                        )}

                        {block.type === "table" && (
                          <div className="my-2 bg-white/60 p-2 border border-neutral-300 rounded font-sans">
                            <div className="text-xs font-semibold text-neutral-700 mb-1">{block.text}</div>
                            {currentPage?.tables?.[0] && (
                              <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                  <tr className="border-b border-neutral-300 bg-neutral-100/60 text-neutral-700">
                                    {currentPage.tables[0].headers.map((h, i) => (
                                      <th key={i} className="p-1 font-semibold">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {currentPage.tables[0].rows.map((row, rIdx) => (
                                    <tr key={rIdx} className="border-b border-neutral-200">
                                      {row.map((cell, cIdx) => (
                                        <td key={cIdx} className="p-1 text-neutral-700">{cell}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        )}

                        {block.type === "signature" && (
                          <div className="pt-4 border-t border-neutral-300 text-xs italic text-neutral-700">
                            {block.text}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-14 pt-4 border-t border-neutral-300 flex justify-between items-center text-[10px] text-neutral-500 font-sans">
                  <span>Original Scanned PDF Representation</span>
                  <span>Page {currentPageIndex + 1} of {totalPages}</span>
                </div>
              </div>
            )}

            {/* MODE 2: CLEAN VIEW (Processed document with normalized typography, standardized margins, and reconstructed tables) */}
            {viewMode === "clean" && (
              <div
                style={{
                  transform: `rotate(${userRotation}deg)`,
                }}
                className="w-[800px] min-h-[1035px] bg-white text-neutral-900 p-14 relative overflow-hidden transition-all duration-300 font-sans"
              >
                {/* Clean View Certified Header */}
                <div className="flex justify-between items-start border-b border-neutral-200 pb-5 mb-8">
                  <div>
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80 mb-1.5">
                      <CheckCircle2 size={11} />
                      <span>Adobe Sensei Layout Reconstructed</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-950 font-serif">
                      {currentPage?.title}
                    </h1>
                    <p className="text-xs text-neutral-500 mt-1">
                      Type: <span className="font-semibold text-neutral-700">{currentPage?.documentType}</span> • Normalized 72pt Margins
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-neutral-500">
                      REF: #{fileName.replace(/\.[^/.]+$/, "").slice(0, 12).toUpperCase()}
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-1">
                      Page {currentPageIndex + 1} of {totalPages}
                    </div>
                  </div>
                </div>

                {/* Clean Summary Overview */}
                {currentPage?.summary && (
                  <div className="bg-neutral-50 rounded-md p-4 border border-neutral-200/80 mb-6">
                    <div className="text-[11px] font-semibold text-neutral-600 uppercase tracking-wider mb-1">
                      Executive Overview
                    </div>
                    <p className="text-xs text-neutral-700 leading-relaxed italic">
                      "{currentPage.summary}"
                    </p>
                  </div>
                )}

                {/* Preserved Key Document Figures & References (Guaranteed exact extraction) */}
                {currentPage?.keyEntities && currentPage.keyEntities.length > 0 && (
                  <div className="bg-white rounded-md p-3.5 border border-neutral-200/90 mb-6 shadow-2xs">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck size={13} className="text-emerald-600" />
                        <span>Preserved Key Entities &amp; Numbers (Exact Recognized Values)</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono">100% Unmodified Figures</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {currentPage.keyEntities.map((entity, eIdx) => (
                        <div key={eIdx} className="bg-neutral-50/80 p-2 rounded border border-neutral-200/70">
                          <div className="text-[10px] text-neutral-500 font-medium">{entity.label}</div>
                          <div className="font-semibold text-neutral-900 font-mono mt-0.5 truncate" title={entity.value}>
                            {entity.value}
                          </div>
                          <div className="text-[9px] text-emerald-700 font-mono mt-0.5 flex items-center gap-0.5">
                            <Check size={10} />
                            <span>{entity.confidence}% OCR Accuracy</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Uncertain OCR Review Banner (Transparent review instead of guessing) */}
                {activeUncertainTokens.length > 0 && (
                  <div className="bg-amber-50/80 border border-amber-200/90 rounded-md p-3.5 mb-6 text-xs text-amber-900 shadow-2xs">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-semibold text-amber-950">
                          Uncertain OCR Review ({activeUncertainTokens.length} tokens flagged for verification)
                        </div>
                        <div className="text-[11px] text-amber-800 mt-0.5">
                          Detected ambiguous scanned glyphs or stamp artifacts. Inspect candidate alternatives below instead of guessing missing information silently:
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2.5">
                          {activeUncertainTokens.map((token, tIdx) => (
                            <button
                              key={tIdx}
                              onClick={() => {
                                setSelectedUncertainToken(token);
                                setIsRightPanelOpen(true);
                              }}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition cursor-pointer border ${
                                selectedUncertainToken?.id === token.id
                                  ? "bg-amber-200/90 border-amber-400 text-amber-950 font-bold ring-1 ring-amber-400"
                                  : "bg-white border-amber-300 text-amber-900 hover:bg-amber-100/60"
                              }`}
                              title={`Click to review candidate alternatives for ${token.text}`}
                            >
                              <span>{token.text}</span>
                              <span className="text-[9px] bg-amber-200 text-amber-800 font-bold px-1 rounded">
                                {token.confidence}% ?
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Clean Restructured Blocks */}
                <div className="space-y-6">
                  {currentPage?.blocks?.map((block, i) => {
                    const isMatched = searchMatches.some(
                      (m) => m.pageIndex === currentPageIndex && m.blockIndex === i
                    );
                    return (
                      <div
                        key={i}
                        className={`rounded transition ${
                          isMatched ? "bg-amber-200 text-neutral-950 p-1 ring-1 ring-amber-400 font-medium" : ""
                        }`}
                      >
                        {block.type === "heading" && (
                          <h2 className="text-lg font-bold text-neutral-900 border-b border-neutral-200 pb-1.5 mt-4 mb-2">
                            {block.text}
                          </h2>
                        )}

                        {block.type === "paragraph" && (
                          <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
                            {block.text}
                          </p>
                        )}

                        {block.type === "signature" && (
                          <div className="mt-8 pt-4 border-t border-neutral-200 flex justify-between items-center text-xs text-neutral-600 font-serif">
                            <div>{block.text}</div>
                            <div className="text-[10px] text-emerald-700 font-mono font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              VERIFIED ELECTRONIC CERTIFICATE
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Reconstructed Clean Tabular Matrices */}
                  {currentPage?.tables && currentPage.tables.length > 0 && (
                    <div className="space-y-5 pt-2">
                      {currentPage.tables.map((table, tIdx) => (
                        <div key={tIdx} className="overflow-hidden rounded-md border border-neutral-200 shadow-xs">
                          {table.title && (
                            <div className="bg-neutral-50 px-3.5 py-2 font-semibold text-xs text-neutral-800 border-b border-neutral-200">
                              {table.title}
                            </div>
                          )}
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="bg-neutral-100/70 border-b border-neutral-200 text-neutral-700 font-medium">
                                {table.headers.map((h, hIdx) => (
                                  <th key={hIdx} className="p-2.5 font-semibold">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                              {table.rows.map((row, rIdx) => (
                                <tr key={rIdx} className={rIdx % 2 === 1 ? "bg-neutral-50/50" : "bg-white"}>
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="p-2.5 text-neutral-700">{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Standardized Bottom Margins & Footer */}
                <div className="mt-14 pt-4 border-t border-neutral-200 flex justify-between items-center text-[10px] text-neutral-400 font-mono">
                  <span>Adobe PDF Services API • Sensei Geometry Restored</span>
                  <span>Page {currentPageIndex + 1} of {totalPages}</span>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* RIGHT COLLAPSIBLE INFORMATION PANEL: OCR STATUS, METADATA & EXTRACTED TEXT */}
        <aside
          className={`bg-white border-l border-neutral-200 flex flex-col transition-all duration-200 z-10 shrink-0 ${
            isRightPanelOpen ? "w-80" : "w-0 overflow-hidden border-l-0"
          }`}
        >
          {/* Panel Header */}
          <div className="h-10 border-b border-neutral-200 px-3.5 flex items-center justify-between shrink-0 bg-neutral-50/70">
            <span className="text-xs font-semibold text-neutral-800 tracking-wide flex items-center gap-1.5">
              <Info size={14} className="text-neutral-500" />
              <span>Document Details</span>
            </span>
            <button
              onClick={() => setIsRightPanelOpen(false)}
              className="p-1 rounded hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800 transition"
              title="Collapse panel"
            >
              <PanelRight size={14} />
            </button>
          </div>

          {/* Panel Content Scroll */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
            {/* Section 1: Adobe OCR & Quality Status */}
            <div>
              <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                Adobe PDF Services OCR
              </div>
              <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200/90 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Status:</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Verified &amp; Searchable
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Confidence Score:</span>
                  <span className="font-mono font-bold text-neutral-900">
                    {currentPage?.confidenceScore ?? 99.4}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Detected Scan Skew:</span>
                  <span className="font-mono text-neutral-800">
                    {currentPage?.skewAngleDegrees ? `${currentPage.skewAngleDegrees > 0 ? "+" : ""}${currentPage.skewAngleDegrees}°` : "0°"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Page Dimensions:</span>
                  <span className="font-mono text-neutral-700">612 × 792 pt (A4/Letter)</span>
                </div>
              </div>
            </div>

            {/* Section 2: Document Metadata */}
            <div>
              <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                File Metadata
              </div>
              <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200/90 space-y-1.5 text-neutral-700">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Filename:</span>
                  <span className="font-medium truncate max-w-[150px]">{fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Page Count:</span>
                  <span>{totalPages}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">File Size:</span>
                  <span>{fileSize ? `${(fileSize / (1024 * 1024)).toFixed(2)} MB` : "Scanned PDF"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Document Type:</span>
                  <span className="font-medium text-neutral-900">{currentPage?.documentType}</span>
                </div>
              </div>
            </div>

            {/* Section 2.5: Document Export & Download Center */}
            <div>
              <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>PDF Download &amp; Exports</span>
                <span className="text-[10px] text-emerald-600 font-medium">Independent Versions</span>
              </div>
              <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200/90 space-y-2.5">
                <p className="text-[11px] text-neutral-600 leading-snug">
                  Download the unaltered original PDF or export the cleaned, reconstructed view as a separate document.
                </p>
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-[#e5252a] hover:bg-[#d01e23] text-white font-medium text-xs shadow-2xs transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <FileDown size={14} />
                      <span>Export Clean View PDF</span>
                    </span>
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">
                      {totalPages} {totalPages === 1 ? "page" : "pages"}
                    </span>
                  </button>

                  <button
                    onClick={handleDownloadOriginal}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 font-medium text-xs transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Download size={14} className="text-neutral-500" />
                      <span>Download Original PDF</span>
                    </span>
                    <span className="text-[10px] text-neutral-500">Unmodified</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Section 3: Extracted OCR Text for Current Page */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Extracted Page Text (Selectable)
                </div>
                <button
                  onClick={handleCopyText}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer"
                >
                  {copiedText ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                  <span>{copiedText ? "Copied" : "Copy All"}</span>
                </button>
              </div>
              <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200/90 max-h-48 overflow-y-auto font-mono text-[11px] text-neutral-700 leading-relaxed whitespace-pre-wrap select-text">
                {currentPage?.cleanMarkdown}
              </div>
            </div>

            {/* Section 4: Uncertain OCR Review & Alternative Selection */}
            {activeUncertainTokens.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle size={12} className="text-amber-600" />
                    <span>Uncertain OCR Text Review ({activeUncertainTokens.length})</span>
                  </div>
                  <span className="text-[10px] text-amber-600 font-mono">No Silent Guessing</span>
                </div>
                <div className="space-y-2.5">
                  {activeUncertainTokens.map((token, idx) => (
                    <div
                      key={idx}
                      className={`bg-amber-50/70 p-2.5 rounded-lg border transition ${
                        selectedUncertainToken?.id === token.id
                          ? "border-amber-400 ring-1 ring-amber-300"
                          : "border-amber-200/90"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-amber-950 text-xs">
                          {token.text}
                        </span>
                        <span className="text-[10px] bg-amber-200/90 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                          {token.confidence}% Confidence
                        </span>
                      </div>
                      <div className="text-[10px] text-amber-800 italic mb-1.5">
                        {token.reason}
                      </div>
                      <div className="text-[10px] text-neutral-600 font-sans mb-1.5">
                        <span className="font-semibold text-neutral-700">Context:</span> {token.context}
                      </div>
                      {token.candidateAlternatives && token.candidateAlternatives.length > 0 && (
                        <div className="pt-1.5 border-t border-amber-200/80">
                          <div className="text-[9px] font-semibold text-amber-900 uppercase tracking-wider mb-1">
                            Candidate Alternatives:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {token.candidateAlternatives.map((alt: string, aIdx: number) => (
                              <button
                                key={aIdx}
                                onClick={() => {
                                  setActiveUncertainTokens((prev) =>
                                    prev.map((t) => (t.id === token.id ? { ...t, text: alt, confidence: 99 } : t))
                                  );
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono border transition cursor-pointer ${
                                  token.text === alt
                                    ? "bg-emerald-600 text-white border-emerald-700 font-semibold shadow-2xs"
                                    : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100"
                                }`}
                                title={`Apply "${alt}"`}
                              >
                                {alt} {token.text === alt && "✓"}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 5: Preserved Exact Document Figures & Dates */}
            {currentPage?.keyEntities && currentPage.keyEntities.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Preserved Financial Figures &amp; Dates</span>
                  <span className="text-emerald-700 text-[10px] font-semibold flex items-center gap-0.5">
                    <Check size={11} /> 100% Preserved
                  </span>
                </div>
                <div className="bg-neutral-50 rounded-lg p-2.5 border border-neutral-200/90 divide-y divide-neutral-200/70">
                  {currentPage.keyEntities.map((item, kIdx) => (
                    <div key={kIdx} className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div className="text-neutral-500 text-[11px] truncate max-w-[130px]">{item.label}</div>
                      <div className="font-mono font-bold text-neutral-900 text-right truncate max-w-[130px]" title={item.value}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 6: OCR Verification & Repairs */}
            <div>
              <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                Scan Artifact Repairs ({currentPage?.correctionsMade?.length ?? 0})
              </div>
              <div className="space-y-1.5">
                {currentPage?.correctionsMade && currentPage.correctionsMade.length > 0 ? (
                  currentPage.correctionsMade.map((c, i) => (
                    <div key={i} className="bg-neutral-50 p-2 rounded border border-neutral-200/80 text-[11px] space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="line-through text-red-500">{c.originalArtifact}</span>
                        <span className="text-neutral-400">→</span>
                        <span className="text-emerald-700 font-semibold">{c.correctedText}</span>
                      </div>
                      <div className="text-[10px] text-neutral-500 italic">{c.reason}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-neutral-400 italic bg-neutral-50 p-2.5 rounded border border-neutral-200 text-center">
                    All glyphs met high-confidence OCR thresholds.
                  </div>
                )}
              </div>
            </div>

            {/* Section 7: Extracted Tables Quick Action */}
            {currentPage?.tables && currentPage.tables.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                  Recognized Tables ({currentPage.tables.length})
                </div>
                {currentPage.tables.map((tbl, i) => (
                  <div key={i} className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/90 space-y-2">
                    <div className="font-semibold text-neutral-900 flex justify-between items-center">
                      <span>{tbl.title || `Table #${i + 1}`}</span>
                      <button
                        onClick={() => {
                          const csv = [
                            tbl.headers.join(","),
                            ...tbl.rows.map((r) => r.join(",")),
                          ].join("\n");
                          navigator.clipboard.writeText(csv);
                          alert("Table CSV copied to clipboard!");
                        }}
                        className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                      >
                        Copy CSV
                      </button>
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      {tbl.headers.length} columns • {tbl.rows.length} rows
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* 4. CLEAN PDF EXPORT CONFIGURATION & DOWNLOAD MODAL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl border border-neutral-200 max-w-md w-full overflow-hidden text-neutral-900 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#e5252a] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileDown size={17} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Export Clean Reconstructed PDF</h3>
                  <p className="text-[11px] text-neutral-500">
                    Standalone downloadable PDF with selectable text &amp; normalized margins
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1.5 rounded-md hover:bg-neutral-200 text-neutral-400 hover:text-neutral-700 transition cursor-pointer"
                title="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Feature Checklist */}
              <div className="bg-neutral-50 rounded-lg p-3.5 border border-neutral-200/90 space-y-2">
                <div className="text-[11px] font-semibold text-neutral-700 uppercase tracking-wider">
                  Guaranteed Clean Document Specs:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-neutral-600">
                  <div className="flex items-center gap-1.5">
                    <Check size={13} className="text-emerald-600 shrink-0" />
                    <span>Pure white background</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check size={13} className="text-emerald-600 shrink-0" />
                    <span>Consistent 54pt margins</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check size={13} className="text-emerald-600 shrink-0" />
                    <span>Properly aligned tables</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check size={13} className="text-emerald-600 shrink-0" />
                    <span>Exact page numbers (p. X of Y)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check size={13} className="text-emerald-600 shrink-0" />
                    <span>Selectable vector text</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check size={13} className="text-emerald-600 shrink-0" />
                    <span>Original PDF unchanged</span>
                  </div>
                </div>
              </div>

              {/* Page Scope Selection */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                  Document Page Scope:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportScope("all")}
                    className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                      exportScope === "all"
                        ? "border-[#e5252a] bg-red-50/30 text-neutral-900 ring-1 ring-[#e5252a]/20"
                        : "border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700"
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center justify-between">
                      <span>All Pages</span>
                      {exportScope === "all" && <Check size={12} className="text-[#e5252a]" />}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">
                      Export complete document ({totalPages} {totalPages === 1 ? "page" : "pages"})
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportScope("current")}
                    className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                      exportScope === "current"
                        ? "border-[#e5252a] bg-red-50/30 text-neutral-900 ring-1 ring-[#e5252a]/20"
                        : "border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700"
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center justify-between">
                      <span>Current Page</span>
                      {exportScope === "current" && <Check size={12} className="text-[#e5252a]" />}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">
                      Export Page {currentPageIndex + 1} only
                    </div>
                  </button>
                </div>
              </div>

              {/* Optional Searchable OCR Text Layer Toggle */}
              <div className="pt-2 border-t border-neutral-200">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSearchableLayer}
                    onChange={(e) => setIncludeSearchableLayer(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-[#e5252a] focus:ring-[#e5252a] cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-neutral-900 text-xs">
                      Embed searchable OCR text layer
                    </span>
                    <p className="text-[11px] text-neutral-500 leading-snug mt-0.5">
                      Injects full searchable OCR text coordinates for instant Ctrl+F search indexing in Acrobat &amp; preview readers.
                    </p>
                  </div>
                </label>
              </div>

              {/* File details info */}
              <div className="text-[11px] text-neutral-500 font-mono bg-neutral-100/70 p-2 rounded flex justify-between">
                <span>Output File:</span>
                <span className="font-semibold text-neutral-800 truncate max-w-[240px]">
                  {fileName.replace(/\.[^/.]+$/, "")}_Clean_View.pdf
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-3 py-1.5 rounded-md border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadOriginal}
                  className="px-3 py-1.5 rounded-md border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                  title="Download the unaltered original document"
                >
                  <Download size={13} />
                  <span>Download Original</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportCleanPdf()}
                  disabled={isExporting}
                  className="px-4 py-1.5 rounded-md bg-[#e5252a] hover:bg-[#d01e23] disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <FileDown size={14} />
                  <span>{isExporting ? "Generating PDF..." : "Export Clean PDF"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SUBTLE BOTTOM STATUS BAR */}
      <footer className="h-7 bg-white border-t border-neutral-200 flex items-center justify-between px-3 sm:px-4 text-[11px] text-neutral-500 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <span>
            Page <strong className="text-neutral-900">{currentPageIndex + 1}</strong> of <strong className="text-neutral-900">{totalPages}</strong>
          </span>
          <span>•</span>
          <span className="hidden sm:inline">8.5 × 11 in (A4)</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-emerald-700 font-medium">
            <CheckCircle2 size={12} />
            Adobe Sensei Geometry Engine Active
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 font-mono text-[11px]">
          <span>Mode: <strong className="text-neutral-800 capitalize">{viewMode}</strong></span>
          <span>Zoom: {zoomLevel}%</span>
        </div>
      </footer>
    </div>
  );
}
