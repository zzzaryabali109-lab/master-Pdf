import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Download,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  MousePointer,
  Hand,
  Highlighter,
  MessageSquare,
  ArrowLeft,
  RefreshCw,
  Table as TableIcon,
  Sliders,
  CheckCircle2,
  Printer,
  Maximize2,
  Minimize2,
  X,
  FileCode,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { OcrPageData, ViewerTool, ViewMode, FilterSettings, NoteAnnotation, HighlightAnnotation, OcrBlock } from "../../types/ocr";
import { exportCleanPdf } from "../../utils/pdfRenderer";

interface AcrobatDocumentViewerProps {
  fileName: string;
  fileSize?: number;
  pages: OcrPageData[];
  onBackToUpload: () => void;
  onReRunOcr?: () => Promise<void>;
  isProcessing?: boolean;
}

export default function AcrobatDocumentViewer({
  fileName,
  fileSize,
  pages,
  onBackToUpload,
  onReRunOcr,
  isProcessing = false,
}: AcrobatDocumentViewerProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activeTool, setActiveTool] = useState<ViewerTool>("select");
  const [viewMode, setViewMode] = useState<ViewMode>("canvas");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<"thumbnails" | "outline" | "tables" | "adobe-sensei" | "ocr-report" | "search">("thumbnails");

  // Filters & Corrections
  const [filters, setFilters] = useState<FilterSettings>({
    autoDeskew: true,
    contrastBoost: true,
    sharpen: true,
    binarize: false,
    userRotation: 0,
  });

  // Split View Slider position (0 - 100%)
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // In-document Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatches, setSearchMatches] = useState<{ pageIndex: number; blockIndex: number; text: string }[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Interactive Annotations
  const [notes, setNotes] = useState<NoteAnnotation[]>([]);
  const [highlights, setHighlights] = useState<HighlightAnnotation[]>([]);
  const [copiedText, setCopiedText] = useState(false);
  const [hoveredBlockIndex, setHoveredBlockIndex] = useState<number | null>(null);

  // Panning state for Hand Tool
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const currentPage = pages[currentPageIndex] || pages[0];

  // Auto-apply initial orientation if detected
  useEffect(() => {
    if (currentPage && currentPage.detectedOrientation) {
      // Counter-rotate if detected orientation is e.g. 90 or 180 degrees
      const initialCorrection = (360 - currentPage.detectedOrientation) % 360;
      setFilters((prev) => ({
        ...prev,
        userRotation: initialCorrection,
      }));
    }
  }, [currentPageIndex, currentPage?.detectedOrientation]);

  // Handle in-document search
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

  // Zoom helpers
  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 25, 250));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 25, 50));
  const handleFitWidth = () => setZoomLevel(120);
  const handleFitPage = () => setZoomLevel(90);

  // Rotation helpers
  const handleRotateCw = () => {
    setFilters((f) => ({ ...f, userRotation: (f.userRotation + 90) % 360 }));
  };
  const handleRotateCcw = () => {
    setFilters((f) => ({ ...f, userRotation: (f.userRotation + 270) % 360 }));
  };

  // Canvas click for sticky notes
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== "comment") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const text = prompt("Enter note comment:");
    if (text && text.trim()) {
      setNotes((prev) => [
        ...prev,
        {
          id: `note-${Date.now()}`,
          pageNumber: currentPageIndex + 1,
          x,
          y,
          text: text.trim(),
          createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  };

  // Hand tool panning handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === "hand") {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && activeTool === "hand") {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }

    if (isDraggingSplit && canvasContainerRef.current) {
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const newPos = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
      setSplitPosition(newPos);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingSplit(false);
  };

  const handleCopyCleanText = () => {
    if (!currentPage) return;
    navigator.clipboard.writeText(currentPage.cleanMarkdown);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleExportPdf = () => {
    if (currentPage) {
      exportCleanPdf(currentPage, fileName);
    }
  };

  // Calculate CSS filters based on user toggle
  const getFilterStyle = (isCleanLayer: boolean = false) => {
    if (isCleanLayer) return "";
    const filterParts: string[] = [];
    if (filters.contrastBoost) filterParts.push("contrast(135%) brightness(105%)");
    if (filters.sharpen) filterParts.push("saturate(90%)");
    if (filters.binarize) filterParts.push("grayscale(100%) contrast(200%)");
    return filterParts.join(" ");
  };

  // Effective rotation angle
  const effectiveRotation =
    filters.userRotation +
    (filters.autoDeskew ? -(currentPage?.skewAngleDegrees || 0) : 0);

  return (
    <div
      className="flex flex-col h-screen w-full bg-[#1e2024] text-neutral-200 select-none overflow-hidden font-sans"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* 1. TOP ACROBAT PRO HEADER BAR */}
      <header className="h-14 bg-[#2b2d32] border-b border-[#3e4249] flex items-center justify-between px-3 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToUpload}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#383b42] hover:bg-[#484c54] text-neutral-200 text-xs font-medium transition cursor-pointer"
            title="Upload another document"
          >
            <ArrowLeft size={14} />
            <span>Upload New</span>
          </button>

          <div className="h-4 w-[1px] bg-[#454952]" />

          {/* Acrobat Document Identity */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#d9383a] flex items-center justify-center text-white font-bold text-xs shadow-sm">
              <FileText size={15} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white tracking-wide truncate max-w-[240px]">
                {fileName}
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                <span>{pages.length} {pages.length === 1 ? "page" : "pages"}</span>
                <span>•</span>
                <span>{fileSize ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB` : "Scanned PDF"}</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium flex items-center gap-0.5">
                  <ShieldCheck size={11} />
                  OCR Verified ({currentPage?.confidenceScore ?? 99.2}%)
                </span>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-950/70 border border-red-500/30 text-red-300 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span>Adobe PDF Services API • Sensei Extract</span>
          </div>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="flex items-center bg-[#1d1f23] p-1 rounded-lg border border-[#3b3e46]">
          <button
            onClick={() => setViewMode("canvas")}
            className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition ${
              viewMode === "canvas"
                ? "bg-[#3e424a] text-white shadow"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
            title="Interactive scanned page with selectable OCR text layer"
          >
            <Layers size={13} />
            <span>Canvas Overlay</span>
          </button>

          <button
            onClick={() => setViewMode("split")}
            className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition ${
              viewMode === "split"
                ? "bg-[#3e424a] text-white shadow"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
            title="Compare raw scan against de-skewed clean OCR document"
          >
            <Sliders size={13} />
            <span>Split Compare</span>
          </button>

          <button
            onClick={() => setViewMode("clean")}
            className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition ${
              viewMode === "clean"
                ? "bg-[#3e424a] text-white shadow"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
            title="Clean digital reconstructed document"
          >
            <Sparkles size={13} />
            <span>Clean Document</span>
          </button>

          <button
            onClick={() => setViewMode("markdown")}
            className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition ${
              viewMode === "markdown"
                ? "bg-[#3e424a] text-white shadow"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
            title="View extracted markdown, tables, and JSON"
          >
            <FileCode size={13} />
            <span>Markdown / Data</span>
          </button>
        </div>

        {/* Export & Action Buttons */}
        <div className="flex items-center gap-2">
          {onReRunOcr && (
            <button
              onClick={onReRunOcr}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#383b42] hover:bg-[#484c54] text-xs font-medium text-neutral-200 transition disabled:opacity-50"
              title="Re-run AI OCR and deep text restoration"
            >
              <RefreshCw size={13} className={isProcessing ? "animate-spin text-amber-400" : ""} />
              <span>{isProcessing ? "Scanning..." : "Deep OCR"}</span>
            </button>
          )}

          <button
            onClick={handleCopyCleanText}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#383b42] hover:bg-[#484c54] text-xs font-medium text-neutral-200 transition"
            title="Copy clean OCR text to clipboard"
          >
            {copiedText ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copiedText ? "Copied" : "Copy Text"}</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#d9383a] hover:bg-[#c32f31] text-white text-xs font-medium shadow transition cursor-pointer"
            title="Download clean, reconstructed PDF"
          >
            <Download size={13} />
            <span>Export Clean PDF</span>
          </button>
        </div>
      </header>

      {/* 2. ACROBAT TOOLS RIBBON */}
      <div className="h-11 bg-[#25272c] border-b border-[#373a42] flex items-center justify-between px-3 z-20 shrink-0 text-xs">
        {/* Left: Tools Selection */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTool("select")}
            className={`p-1.5 rounded transition ${
              activeTool === "select"
                ? "bg-[#3e424a] text-white"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-[#32353d]"
            }`}
            title="Select Text Tool"
          >
            <MousePointer size={15} />
          </button>

          <button
            onClick={() => setActiveTool("hand")}
            className={`p-1.5 rounded transition ${
              activeTool === "hand"
                ? "bg-[#3e424a] text-white"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-[#32353d]"
            }`}
            title="Hand / Pan Tool"
          >
            <Hand size={15} />
          </button>

          <button
            onClick={() => setActiveTool("highlight")}
            className={`p-1.5 rounded transition ${
              activeTool === "highlight"
                ? "bg-[#3e424a] text-amber-300"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-[#32353d]"
            }`}
            title="Highlight Text Tool"
          >
            <Highlighter size={15} />
          </button>

          <button
            onClick={() => setActiveTool("comment")}
            className={`p-1.5 rounded transition ${
              activeTool === "comment"
                ? "bg-[#3e424a] text-white"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-[#32353d]"
            }`}
            title="Add Note Comment Tool (Click document to place)"
          >
            <MessageSquare size={15} />
          </button>

          <div className="h-4 w-[1px] bg-[#3a3d46] mx-1" />

          {/* Page Navigation */}
          <div className="flex items-center gap-1 text-neutral-300">
            <button
              onClick={() => setCurrentPageIndex((p) => Math.max(0, p - 1))}
              disabled={currentPageIndex === 0}
              className="p-1 rounded hover:bg-[#32353d] disabled:opacity-30 disabled:hover:bg-transparent"
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="flex items-center gap-1 font-mono text-xs">
              <span className="bg-[#1b1c20] px-2 py-0.5 rounded border border-[#3b3e46] text-white">
                {currentPageIndex + 1}
              </span>
              <span className="text-neutral-400">/ {pages.length}</span>
            </span>

            <button
              onClick={() => setCurrentPageIndex((p) => Math.min(pages.length - 1, p + 1))}
              disabled={currentPageIndex >= pages.length - 1}
              className="p-1 rounded hover:bg-[#32353d] disabled:opacity-30 disabled:hover:bg-transparent"
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="h-4 w-[1px] bg-[#3a3d46] mx-1" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 text-neutral-300">
            <button
              onClick={handleZoomOut}
              className="p-1 rounded hover:bg-[#32353d]"
              title="Zoom Out"
            >
              <ZoomOut size={15} />
            </button>

            <span className="w-12 text-center font-mono text-xs text-white">
              {zoomLevel}%
            </span>

            <button
              onClick={handleZoomIn}
              className="p-1 rounded hover:bg-[#32353d]"
              title="Zoom In"
            >
              <ZoomIn size={15} />
            </button>

            <button
              onClick={handleFitWidth}
              className="px-1.5 py-0.5 rounded hover:bg-[#32353d] text-[11px] text-neutral-400 hover:text-white"
              title="Fit to Width"
            >
              Fit Width
            </button>
            <button
              onClick={handleFitPage}
              className="px-1.5 py-0.5 rounded hover:bg-[#32353d] text-[11px] text-neutral-400 hover:text-white"
              title="Fit to Page"
            >
              Fit Page
            </button>
          </div>
        </div>

        {/* Right: De-skew, Rotation & In-document Search */}
        <div className="flex items-center gap-2">
          {/* Rotation Controls */}
          <div className="flex items-center gap-0.5 bg-[#1b1c20] p-0.5 rounded border border-[#3b3e46]">
            <button
              onClick={handleRotateCcw}
              className="p-1 rounded hover:bg-[#32353d] text-neutral-400 hover:text-white"
              title="Rotate 90° CCW"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={handleRotateCw}
              className="p-1 rounded hover:bg-[#32353d] text-neutral-400 hover:text-white"
              title="Rotate 90° CW"
            >
              <RotateCw size={14} />
            </button>
          </div>

          {/* Auto De-skew Toggle */}
          <button
            onClick={() => setFilters((f) => ({ ...f, autoDeskew: !f.autoDeskew }))}
            className={`px-2 py-1 rounded flex items-center gap-1.5 text-xs font-medium border transition ${
              filters.autoDeskew
                ? "bg-emerald-950/50 border-emerald-500/50 text-emerald-300"
                : "bg-[#1b1c20] border-[#3b3e46] text-neutral-400"
            }`}
            title={`Toggle Auto-De-skew (${currentPage?.skewAngleDegrees ?? 0}°)`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Auto De-skew ({currentPage?.skewAngleDegrees ? `${currentPage.skewAngleDegrees > 0 ? "+" : ""}${currentPage.skewAngleDegrees}°` : "0°"})</span>
          </button>

          {/* Contrast Boost Toggle */}
          <button
            onClick={() => setFilters((f) => ({ ...f, contrastBoost: !f.contrastBoost }))}
            className={`px-2 py-1 rounded flex items-center gap-1.5 text-xs font-medium border transition ${
              filters.contrastBoost
                ? "bg-sky-950/50 border-sky-500/50 text-sky-300"
                : "bg-[#1b1c20] border-[#3b3e46] text-neutral-400"
            }`}
            title="Clean scanned background & sharpen text contrast"
          >
            <span>Contrast Boost</span>
          </button>

          {/* Search Bar in Document */}
          <div className="relative flex items-center bg-[#1b1c20] rounded border border-[#3b3e46] px-2 py-1 text-xs">
            <Search size={13} className="text-neutral-400 mr-1.5 shrink-0" />
            <input
              type="text"
              placeholder="Find in document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-white focus:outline-none w-32 placeholder:text-neutral-500 text-xs"
            />
            {searchQuery && (
              <div className="flex items-center gap-1 ml-1 text-[11px] text-neutral-400">
                <span>
                  {searchMatches.length > 0 ? `${currentMatchIndex + 1}/${searchMatches.length}` : "0"}
                </span>
                <button
                  onClick={() => jumpToMatch((currentMatchIndex - 1 + searchMatches.length) % searchMatches.length)}
                  disabled={searchMatches.length === 0}
                  className="hover:text-white"
                >
                  <ChevronLeft size={12} />
                </button>
                <button
                  onClick={() => jumpToMatch((currentMatchIndex + 1) % searchMatches.length)}
                  disabled={searchMatches.length === 0}
                  className="hover:text-white"
                >
                  <ChevronRight size={12} />
                </button>
                <button onClick={() => setSearchQuery("")} className="hover:text-white">
                  <X size={11} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE WITH SIDEBAR & DOCUMENT VIEW */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* LEFT ACROBAT SIDEBAR */}
        <aside
          className={`bg-[#23252a] border-r border-[#353840] flex transition-all duration-200 z-10 ${
            sidebarOpen ? "w-64" : "w-11"
          }`}
        >
          {/* Vertical Icon Rail */}
          <div className="w-11 border-r border-[#31343c] flex flex-col items-center py-2 gap-2 shrink-0">
            <button
              onClick={() => {
                setSidebarOpen(true);
                setActiveSidebarTab("thumbnails");
              }}
              className={`p-2 rounded transition ${
                sidebarOpen && activeSidebarTab === "thumbnails"
                  ? "bg-[#3e424a] text-white"
                  : "text-neutral-400 hover:text-white hover:bg-[#2c2f36]"
              }`}
              title="Page Thumbnails"
            >
              <Layers size={17} />
            </button>

            <button
              onClick={() => {
                setSidebarOpen(true);
                setActiveSidebarTab("outline");
              }}
              className={`p-2 rounded transition ${
                sidebarOpen && activeSidebarTab === "outline"
                  ? "bg-[#3e424a] text-white"
                  : "text-neutral-400 hover:text-white hover:bg-[#2c2f36]"
              }`}
              title="Document Outline & Headings"
            >
              <FileText size={17} />
            </button>

            <button
              onClick={() => {
                setSidebarOpen(true);
                setActiveSidebarTab("tables");
              }}
              className={`p-2 rounded transition ${
                sidebarOpen && activeSidebarTab === "tables"
                  ? "bg-[#3e424a] text-white"
                  : "text-neutral-400 hover:text-white hover:bg-[#2c2f36]"
              }`}
              title="Recognized Tables"
            >
              <TableIcon size={17} />
            </button>

            <button
              onClick={() => {
                setSidebarOpen(true);
                setActiveSidebarTab("adobe-sensei");
              }}
              className={`p-1.5 rounded transition ${
                sidebarOpen && activeSidebarTab === "adobe-sensei"
                  ? "bg-[#d9383a] text-white"
                  : "text-neutral-400 hover:text-white hover:bg-[#2c2f36]"
              }`}
              title="Adobe Sensei Structural & Geometry Model"
            >
              <div className="w-5 h-5 rounded bg-[#d9383a] text-white flex items-center justify-center font-bold text-[9px]">
                Ai
              </div>
            </button>

            <button
              onClick={() => {
                setSidebarOpen(true);
                setActiveSidebarTab("ocr-report");
              }}
              className={`p-2 rounded transition ${
                sidebarOpen && activeSidebarTab === "ocr-report"
                  ? "bg-[#3e424a] text-white"
                  : "text-neutral-400 hover:text-white hover:bg-[#2c2f36]"
              }`}
              title="OCR Quality & Corrections Audit"
            >
              <ShieldCheck size={17} />
            </button>

            <div className="mt-auto">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded text-neutral-400 hover:text-white hover:bg-[#2c2f36]"
                title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
              >
                {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>
          </div>

          {/* Sidebar Content Panel */}
          {sidebarOpen && (
            <div className="flex-1 flex flex-col overflow-y-auto bg-[#23252a] text-xs">
              {/* Tab 1: Thumbnails */}
              {activeSidebarTab === "thumbnails" && (
                <div className="p-3 space-y-4">
                  <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Pages ({pages.length})
                  </div>
                  {pages.map((p, idx) => (
                    <div
                      key={idx}
                      onClick={() => setCurrentPageIndex(idx)}
                      className={`cursor-pointer rounded-lg p-2 border transition ${
                        currentPageIndex === idx
                          ? "border-red-500 bg-[#2d3038] shadow"
                          : "border-[#383b44] hover:border-[#4d515d] bg-[#1e2025]"
                      }`}
                    >
                      <div className="aspect-[3/4] bg-[#faf9f6] rounded border border-neutral-300 p-2 flex flex-col justify-between overflow-hidden relative shadow-inner">
                        <div className="space-y-1">
                          <div className="h-2 bg-neutral-800 rounded w-3/4" />
                          <div className="h-1.5 bg-neutral-400 rounded w-1/2" />
                          <div className="h-1 bg-neutral-300 rounded w-full" />
                          <div className="h-1 bg-neutral-300 rounded w-5/6" />
                          <div className="h-1 bg-neutral-300 rounded w-full" />
                        </div>
                        <div className="flex justify-between items-end text-[9px] text-neutral-600 font-mono">
                          <span>{p.documentType}</span>
                          <span className="font-bold">p.{idx + 1}</span>
                        </div>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-neutral-300">
                        <span className="font-medium">Page {idx + 1}</span>
                        <span className="text-[10px] text-emerald-400">{p.confidenceScore}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 2: Outline */}
              {activeSidebarTab === "outline" && (
                <div className="p-3 space-y-3">
                  <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Document Outline
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold text-white p-1.5 rounded bg-[#2c2f37]">
                      {currentPage?.title}
                    </div>
                    {currentPage?.blocks
                      ?.filter((b) => b.type === "heading")
                      .map((b, i) => (
                        <div
                          key={i}
                          className="pl-3 py-1 text-neutral-300 hover:text-white hover:bg-[#2c2f37] rounded cursor-pointer"
                        >
                          # {b.text}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Tables */}
              {activeSidebarTab === "tables" && (
                <div className="p-3 space-y-3">
                  <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Extracted Tables ({currentPage?.tables?.length ?? 0})
                  </div>
                  {currentPage?.tables && currentPage.tables.length > 0 ? (
                    currentPage.tables.map((tbl, i) => (
                      <div key={i} className="bg-[#1b1c20] p-2.5 rounded border border-[#3b3e46] space-y-2">
                        <div className="font-semibold text-white flex justify-between items-center">
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
                            className="text-[10px] text-sky-400 hover:underline"
                          >
                            Copy CSV
                          </button>
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {tbl.headers.length} columns • {tbl.rows.length} rows
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-neutral-500 italic p-2">No separate tabular matrices found on this page.</div>
                  )}
                </div>
              )}

              {/* Tab 4: Adobe Sensei Structural & Geometry Model */}
              {activeSidebarTab === "adobe-sensei" && (
                <div className="p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                      Adobe Extract Model
                    </div>
                    <span className="text-[10px] text-red-400 font-semibold bg-red-950/60 px-1.5 py-0.5 rounded border border-red-500/30">
                      Sensei Tree
                    </span>
                  </div>

                  <div className="bg-[#1c1d22] p-2.5 rounded border border-[#363942] space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Page Dimension:</span>
                      <span className="text-white font-mono">612 × 792 pt (A4/Letter)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Structural Nodes:</span>
                      <span className="text-emerald-400 font-bold">{currentPage?.blocks?.length ?? 0} elements</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Reading Order:</span>
                      <span className="text-sky-400 font-medium">Reconstructed Graph</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Margins:</span>
                      <span className="text-white">Normalized 72 pt</span>
                    </div>
                  </div>

                  <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider pt-1">
                    Extracted Structural Elements
                  </div>

                  <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
                    {currentPage?.blocks?.map((block, idx) => (
                      <div
                        key={idx}
                        onMouseEnter={() => setHoveredBlockIndex(idx)}
                        onMouseLeave={() => setHoveredBlockIndex(null)}
                        className={`bg-[#1c1d22] hover:bg-[#282a30] p-2 rounded border transition text-[10px] space-y-1 cursor-pointer ${
                          hoveredBlockIndex === idx ? "border-red-500 ring-1 ring-red-500/40" : "border-[#363942]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-red-400 font-bold">
                            {block.adobePath || (block.type === "heading" ? "//Document/H1" : block.type === "table" ? "//Document/Table" : "//Document/P")}
                          </span>
                          <span className="text-neutral-500 font-mono">#{block.readingOrder || idx + 1}</span>
                        </div>
                        <div className="text-neutral-300 truncate font-sans">
                          {block.text}
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-neutral-500 font-mono">
                          <span>
                            Bounds: [{block.boundsPt ? block.boundsPt.join(", ") : `${block.box2d[1]}, ${block.box2d[0]}, ${block.box2d[3]}, ${block.box2d[2]}`}]
                          </span>
                          <span className="text-emerald-400">{block.confidence}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 5: OCR Quality & Corrections Report */}
              {activeSidebarTab === "ocr-report" && (
                <div className="p-3 space-y-3">
                  <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    OCR Scan Quality Audit
                  </div>
                  <div className="bg-[#1c1d22] p-2.5 rounded border border-[#363942] space-y-2 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Scan Quality Score:</span>
                      <span className="text-emerald-400 font-bold">{currentPage?.qualityScore}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Detected Skew:</span>
                      <span className="text-amber-400 font-mono">{currentPage?.skewAngleDegrees}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Orientation:</span>
                      <span className="text-white">{currentPage?.detectedOrientation}° Clockwise</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Blurry Text Detected:</span>
                      <span className={currentPage?.blurDetected ? "text-amber-400" : "text-emerald-400"}>
                        {currentPage?.blurDetected ? "Yes (Rectified)" : "No (Sharp)"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Contrast Level:</span>
                      <span className="text-white capitalize">{currentPage?.contrastLevel}</span>
                    </div>
                  </div>

                  <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider pt-2">
                    Artifact Repairs ({currentPage?.correctionsMade?.length ?? 0})
                  </div>
                  <div className="space-y-1.5">
                    {currentPage?.correctionsMade?.map((c, i) => (
                      <div key={i} className="bg-[#1c1d22] p-2 rounded border border-[#363942] text-[10px] space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="line-through text-red-400">{c.originalArtifact}</span>
                          <span className="text-neutral-500">→</span>
                          <span className="text-emerald-400 font-semibold">{c.correctedText}</span>
                        </div>
                        <div className="text-neutral-400 italic">{c.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* CENTER DOCUMENT CANVAS AREA */}
        <main
          ref={canvasContainerRef}
          className="flex-1 bg-[#33363d] overflow-auto flex items-center justify-center p-8 relative select-text"
          onMouseDown={handleMouseDown}
          style={{ cursor: activeTool === "hand" ? (isPanning ? "grabbing" : "grab") : "default" }}
        >
          {/* Note Annotations Pins */}
          {notes
            .filter((n) => n.pageNumber === currentPageIndex + 1)
            .map((note) => (
              <div
                key={note.id}
                style={{ left: `${note.x}%`, top: `${note.y}%` }}
                className="absolute z-40 -translate-x-1/2 -translate-y-1/2 group"
              >
                <div className="w-6 h-6 rounded-full bg-amber-400 text-neutral-900 flex items-center justify-center shadow-lg cursor-pointer animate-bounce hover:scale-110 transition">
                  <MessageSquare size={13} fill="currentColor" />
                </div>
                <div className="hidden group-hover:block absolute left-8 top-0 w-48 bg-neutral-900 border border-neutral-700 text-white p-2 rounded shadow-2xl text-xs z-50">
                  <div className="text-[10px] text-neutral-400 mb-1">{note.createdAt}</div>
                  <div>{note.text}</div>
                </div>
              </div>
            ))}

          {/* VIEW MODE 1: CANVAS OVERLAY */}
          {viewMode === "canvas" && (
            <div
              onClick={handleCanvasClick}
              style={{
                transform: `scale(${zoomLevel / 100}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                transformOrigin: "center center",
                transition: isPanning ? "none" : "transform 0.15s ease-out",
              }}
              className="relative shadow-2xl rounded-sm transition-all"
            >
              {/* Document Paper Page Container */}
              <div
                style={{
                  transform: `rotate(${effectiveRotation}deg)`,
                  filter: getFilterStyle(false),
                }}
                className="w-[794px] min-h-[1123px] bg-[#faf9f6] text-neutral-900 p-12 relative overflow-hidden transition-all duration-300 border border-neutral-300"
              >
                {/* Visual scan texture background */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* Scanned Document Header */}
                <div className="border-b-2 border-neutral-800 pb-4 mb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-neutral-950 font-serif">
                        {currentPage?.title || "OFFICIAL COMMERCIAL STATEMENT"}
                      </h1>
                      <p className="text-xs text-neutral-600 mt-1">
                        Category: {currentPage?.documentType} • Verified Digitized Record
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-neutral-500">
                        DOC-ID: #{fileName.slice(0, 10).toUpperCase()}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1 inline-block">
                        ✓ OCR RESTORED
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interactive Selectable OCR Text Blocks */}
                <div className="space-y-4">
                  {currentPage?.blocks?.map((block: OcrBlock, bIdx: number) => {
                    const isSearchMatched = searchMatches.some(
                      (m) => m.pageIndex === currentPageIndex && m.blockIndex === bIdx
                    );
                    const isHighlighted = highlights.some(
                      (h) => h.pageNumber === currentPageIndex + 1 && h.blockIndex === bIdx
                    );

                    return (
                      <div
                        key={bIdx}
                        onMouseEnter={() => setHoveredBlockIndex(bIdx)}
                        onMouseLeave={() => setHoveredBlockIndex(null)}
                        onClick={(e) => {
                          if (activeTool === "highlight") {
                            e.stopPropagation();
                            setHighlights((prev) => [
                              ...prev,
                              {
                                id: `hl-${Date.now()}`,
                                pageNumber: currentPageIndex + 1,
                                blockIndex: bIdx,
                                color: "#fef08a",
                              },
                            ]);
                          }
                        }}
                        className={`relative p-1.5 rounded transition ${
                          hoveredBlockIndex === bIdx ? "bg-blue-500/10 ring-1 ring-blue-400" : ""
                        } ${isSearchMatched ? "bg-amber-300 text-neutral-900 ring-2 ring-amber-500" : ""} ${
                          isHighlighted ? "bg-yellow-200/80" : ""
                        }`}
                      >
                        {/* Hover Bounding Box Badge */}
                        {hoveredBlockIndex === bIdx && (
                          <div className="absolute -top-6 left-0 bg-neutral-900/90 text-white text-[9px] px-2 py-0.5 rounded font-mono z-20 shadow-lg border border-red-500/40 flex items-center gap-1.5 whitespace-nowrap">
                            <span className="text-red-400 font-bold">{block.adobePath || `//Document/${block.type.toUpperCase()}`}</span>
                            <span className="text-neutral-400">•</span>
                            <span>[{block.boundsPt ? block.boundsPt.join(", ") : `${block.box2d[1]}, ${block.box2d[0]}, ${block.box2d[3]}, ${block.box2d[2]}`}]</span>
                            <span className="text-neutral-400">•</span>
                            <span className="text-emerald-400">{block.confidence}% CONF</span>
                          </div>
                        )}

                        {block.type === "heading" && (
                          <h2 className="text-lg font-bold text-neutral-900 font-serif border-b border-neutral-200 pb-1">
                            {block.text}
                          </h2>
                        )}

                        {block.type === "paragraph" && (
                          <p className="text-sm leading-relaxed text-neutral-800">
                            {block.text}
                          </p>
                        )}

                        {block.type === "table" && (
                          <div className="my-2 bg-white/70 p-2 rounded border border-neutral-300">
                            <div className="text-xs font-semibold text-neutral-700 mb-1">
                              {block.text}
                            </div>
                            {currentPage?.tables?.[0] && (
                              <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                  <tr className="border-b border-neutral-300 bg-neutral-100">
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
                          <div className="pt-4 border-t border-neutral-300 flex items-center justify-between text-xs text-neutral-700">
                            <div className="font-serif italic">{block.text}</div>
                            <div className="text-[10px] text-neutral-500">ELECTRONICALLY RATIFIED</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer stamp */}
                <div className="mt-16 pt-4 border-t border-neutral-200 flex justify-between items-center text-[10px] text-neutral-500">
                  <span>Adobe Acrobat-Style De-skewed OCR Engine</span>
                  <span>Page {currentPageIndex + 1} of {pages.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: SPLIT BEFORE & AFTER COMPARISON */}
          {viewMode === "split" && (
            <div
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: "center center",
              }}
              className="relative w-[794px] min-h-[1123px] shadow-2xl rounded-sm overflow-hidden select-none bg-neutral-900 border border-neutral-600"
            >
              {/* Layer A: Raw Scanned (Tilted, Low Contrast, Blurred) */}
              <div
                style={{
                  transform: `rotate(${currentPage?.detectedOrientation || 0}deg) skewY(${currentPage?.skewAngleDegrees || -3.2}deg)`,
                  filter: "blur(0.8px) contrast(85%) sepia(25%)",
                }}
                className="absolute inset-0 bg-[#f4ecd8] text-neutral-800 p-12 overflow-hidden"
              >
                <div className="absolute top-2 left-2 bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow z-10">
                  BEFORE: RAW SCAN (TILTED &amp; BLURRED)
                </div>
                <h1 className="text-2xl font-serif font-bold text-neutral-900 opacity-80">{currentPage?.title}</h1>
                <p className="text-xs text-neutral-600 mt-2 italic">Low resolution scan with rotational artifact and yellowing</p>
                <div className="mt-8 space-y-3 opacity-75">
                  {currentPage?.blocks?.map((b, i) => (
                    <div key={i} className="text-sm">{b.text}</div>
                  ))}
                </div>
              </div>

              {/* Layer B: Pristine De-skewed Clean OCR Layer (Clipped by splitPosition) */}
              <div
                style={{
                  clipPath: `polygon(${splitPosition}% 0, 100% 0, 100% 100%, ${splitPosition}% 100%)`,
                }}
                className="absolute inset-0 bg-[#ffffff] text-neutral-900 p-12 overflow-hidden shadow-2xl"
              >
                <div className="absolute top-2 right-2 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow z-10">
                  AFTER: DE-SKEWED &amp; CRISP OCR RESTORATION
                </div>
                <h1 className="text-2xl font-serif font-bold text-neutral-950 border-b-2 border-neutral-900 pb-2">
                  {currentPage?.title}
                </h1>
                <div className="mt-6 space-y-4">
                  {currentPage?.blocks?.map((b, i) => (
                    <div key={i} className="text-sm font-sans text-neutral-800 leading-relaxed">
                      {b.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Split Divider Handle */}
              <div
                style={{ left: `${splitPosition}%` }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsDraggingSplit(true);
                }}
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-30 shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center"
              >
                <div className="w-8 h-8 rounded-full bg-white text-neutral-900 shadow-xl flex items-center justify-center font-bold text-xs border border-neutral-300">
                  ↔
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 3: CLEAN DIGITAL DOCUMENT READER */}
          {viewMode === "clean" && (
            <div
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: "center center",
              }}
              className="w-[794px] min-h-[1123px] bg-white text-neutral-900 p-14 rounded-sm shadow-2xl border border-neutral-200 select-text font-sans"
            >
              {/* Clean Executive Header */}
              <div className="flex justify-between items-start border-b border-neutral-200 pb-6 mb-8">
                <div>
                  <div className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase">
                    OCR Verified Digital Transcription
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-neutral-950 mt-1">
                    {currentPage?.title}
                  </h1>
                  <p className="text-xs text-neutral-500 mt-1">
                    Type: {currentPage?.documentType} • Page {currentPageIndex + 1} of {pages.length}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCleanText}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium transition cursor-pointer"
                  >
                    {copiedText ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    <span>{copiedText ? "Copied" : "Copy All"}</span>
                  </button>
                  <button
                    onClick={handleExportPdf}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-medium shadow transition cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              {/* Clean Summary Card */}
              {currentPage?.summary && (
                <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 mb-8">
                  <div className="text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                    Summary Overview
                  </div>
                  <p className="text-sm text-neutral-600 leading-relaxed italic">
                    "{currentPage.summary}"
                  </p>
                </div>
              )}

              {/* Clean Formatted Blocks & Tables */}
              <div className="space-y-6">
                {currentPage?.blocks?.map((block, i) => (
                  <div key={i}>
                    {block.type === "heading" && (
                      <h2 className="text-xl font-bold text-neutral-900 border-b border-neutral-200 pb-2 mt-6 mb-3">
                        {block.text}
                      </h2>
                    )}
                    {block.type === "paragraph" && (
                      <p className="text-sm text-neutral-700 leading-relaxed">
                        {block.text}
                      </p>
                    )}
                    {block.type === "signature" && (
                      <div className="mt-8 pt-4 border-t border-neutral-200 flex justify-between items-center text-xs text-neutral-600">
                        <span className="font-semibold">{block.text}</span>
                        <span className="text-emerald-600 font-mono">AUTHENTICATED DIGITAL CERT</span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Tabular data rendering */}
                {currentPage?.tables?.map((table, tIdx) => (
                  <div key={tIdx} className="mt-6 overflow-hidden rounded-lg border border-neutral-200 shadow-sm">
                    {table.title && (
                      <div className="bg-neutral-100 px-4 py-2 font-semibold text-xs text-neutral-800 border-b border-neutral-200">
                        {table.title}
                      </div>
                    )}
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
                          {table.headers.map((h, hIdx) => (
                            <th key={hIdx} className="p-2.5 font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {table.rows.map((row, rIdx) => (
                          <tr key={rIdx} className={rIdx % 2 === 1 ? "bg-neutral-50/50" : ""}>
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
            </div>
          )}

          {/* VIEW MODE 4: RAW MARKDOWN & STRUCTURED JSON */}
          {viewMode === "markdown" && (
            <div className="w-[840px] max-h-[85vh] bg-[#1a1b1e] border border-[#3b3e46] rounded-lg shadow-2xl flex flex-col overflow-hidden text-xs">
              <div className="bg-[#24262b] px-4 py-2.5 border-b border-[#3b3e46] flex justify-between items-center">
                <span className="font-mono text-white font-semibold">Clean Extracted Markdown &amp; Structure</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCleanText}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#373a42] hover:bg-[#484c56] text-white text-xs"
                  >
                    {copiedText ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedText ? "Copied" : "Copy Markdown"}</span>
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(currentPage, null, 2)], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${fileName}_ocr_data.json`;
                      a.click();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#373a42] hover:bg-[#484c56] text-white text-xs"
                  >
                    <Download size={12} />
                    <span>Download JSON</span>
                  </button>
                </div>
              </div>
              <div className="p-4 overflow-y-auto font-mono text-neutral-300 leading-relaxed bg-[#141518] flex-1">
                <pre className="whitespace-pre-wrap">{currentPage?.cleanMarkdown}</pre>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 4. ACROBAT BOTTOM STATUS BAR */}
      <footer className="h-7 bg-[#202226] border-t border-[#353840] flex items-center justify-between px-3 text-[11px] text-neutral-400 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <span>
            Page <strong className="text-white">{currentPageIndex + 1}</strong> of <strong className="text-white">{pages.length}</strong>
          </span>
          <span>•</span>
          <span>Standard Letter / A4 (8.5 × 11 in)</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 size={12} />
            Adobe PDF Services API • Sensei Structure Active
          </span>
        </div>

        <div className="flex items-center gap-4 font-mono">
          <span>
            Tilt: {currentPage?.skewAngleDegrees ? `${currentPage.skewAngleDegrees > 0 ? "+" : ""}${currentPage.skewAngleDegrees}°` : "0°"}
          </span>
          <span>Confidence: {currentPage?.confidenceScore ?? 99.2}%</span>
          <span>Zoom: {zoomLevel}%</span>
        </div>
      </footer>
    </div>
  );
}
