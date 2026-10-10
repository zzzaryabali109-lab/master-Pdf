import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import FileDropzone, { FileDropzoneUpload } from "@/components/arc/file-dropzone/file-dropzone";
import ActionButton from "@/components/arc/action-button/action-button";
import AcrobatPdfProcessingPage from "./components/acrobat/AcrobatPdfProcessingPage";
import { OcrPageData } from "./types/ocr";
import { SAMPLE_DOCUMENTS } from "./utils/sampleDocuments";
import { renderPdfToImages } from "./utils/pdfRenderer";
import { FileText, Sparkles, CheckCircle2 } from "lucide-react";

export default function App() {
  const [hasUploaded, setHasUploaded] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isViewingDocument, setIsViewingDocument] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState("Initializing...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ocrPages, setOcrPages] = useState<OcrPageData[]>([]);
  const [activeFileName, setActiveFileName] = useState("document.pdf");
  const [activeFileSize, setActiveFileSize] = useState<number | undefined>(undefined);

  // Preserve existing upload logic exactly as provided
  const handleUpload: FileDropzoneUpload = async (item, { onProgress }) => {
    if (item.file) {
      setCurrentFile(item.file);
      setActiveFileName(item.file.name);
      setActiveFileSize(item.file.size);
    }
    for (let progress = 20; progress <= 100; progress += 20) {
      await new Promise((resolve) => setTimeout(resolve, 80));
      onProgress(progress);
    }
    setHasUploaded(true);
  };

  // Process document through Adobe PDF Services API backend with progress tracking and error handling
  const processDocumentOcr = async (file: File) => {
    setIsOcrProcessing(true);
    setErrorMessage(null);
    setProcessingProgress(15);
    setProcessingStage("Rendering document pages into high-DPI canvas...");

    try {
      const { pageImages } = await renderPdfToImages(file);
      setProcessingProgress(40);
      setProcessingStage("Submitting to Adobe PDF Services OCR & Sensei Extract...");

      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const pdfBase64 = btoa(binary);

      setProcessingProgress(65);
      setProcessingStage("Analyzing reading order, bounding geometry & tables...");

      // Call Adobe PDF Services endpoint
      const adobeRes = await fetch("/api/adobe/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfBase64,
          fileName: file.name,
          pageCount: pageImages.length,
        }),
      });

      const adobeJson = await adobeRes.json();
      if (!adobeRes.ok || !adobeJson.success) {
        throw new Error(adobeJson.error || "Adobe PDF Services processing returned an error.");
      }

      if (Array.isArray(adobeJson.data) && adobeJson.data.length > 0) {
        setProcessingProgress(90);
        setProcessingStage("Reconstructing clean typography & normalized margins...");
        await new Promise((resolve) => setTimeout(resolve, 300));

        const processedPages: OcrPageData[] = adobeJson.data.map((page: OcrPageData, idx: number) => ({
          ...page,
          pageNumber: idx + 1,
          imageSrc: pageImages[idx] || pageImages[0] || page.imageSrc,
        }));

        setOcrPages(processedPages);
        setProcessingProgress(100);
        setProcessingStage("Ready");
      } else {
        throw new Error("No structured page data returned from Adobe PDF Services.");
      }
    } catch (err: any) {
      console.error("Error processing document with Adobe PDF Services:", err);
      setErrorMessage(
        err?.message || "Failed to complete Adobe PDF Services processing. Check file format or network connection."
      );
      // Retain sample preview so user can still inspect interface while showing error banner with Retry option
      if (ocrPages.length === 0) {
        setOcrPages(SAMPLE_DOCUMENTS[0].pages);
      }
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const handleContinue = async () => {
    if (currentFile) {
      await processDocumentOcr(currentFile);
    } else {
      // Default to sample invoice if test file metadata is selected
      setOcrPages(SAMPLE_DOCUMENTS[0].pages);
      setActiveFileName(SAMPLE_DOCUMENTS[0].name);
      setActiveFileSize(SAMPLE_DOCUMENTS[0].fileSize);
    }
    setIsViewingDocument(true);
  };

  const handleSelectSample = (sampleId: string) => {
    const sample = SAMPLE_DOCUMENTS.find((s) => s.id === sampleId) || SAMPLE_DOCUMENTS[0];
    setActiveFileName(sample.name);
    setActiveFileSize(sample.fileSize);
    setOcrPages(sample.pages);
    setIsViewingDocument(true);
  };

  // If viewing document, display Adobe Acrobat-Style PDF Processing Page
  if (isViewingDocument && ocrPages.length > 0) {
    return (
      <AcrobatPdfProcessingPage
        fileName={activeFileName}
        fileSize={activeFileSize}
        pages={ocrPages}
        onBackToUpload={() => {
          setIsViewingDocument(false);
          setErrorMessage(null);
        }}
        onReRunOcr={currentFile ? () => processDocumentOcr(currentFile) : undefined}
        isProcessing={isOcrProcessing}
        processingProgress={processingProgress}
        processingStage={processingStage}
        errorMessage={errorMessage}
        onRetry={currentFile ? () => processDocumentOcr(currentFile) : undefined}
      />
    );
  }

  // Preserve existing upload UI, styling, and behavior
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-lg flex flex-col items-center gap-4">
        {/* Header Branding */}
        <div className="text-center space-y-1 mb-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 text-xs font-semibold">
            <Sparkles size={13} />
            <span>Adobe PDF Services API • Sensei OCR &amp; Extract</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            Adobe PDF OCR &amp; Clean Document Viewer
          </h1>
          <p className="text-xs text-neutral-500">
            Process poorly scanned, rotated, or blurry PDFs, bills of lading, &amp; invoices with Adobe Sensei layout reconstruction
          </p>
        </div>

        {/* Existing PDF Upload Dropzone: Kept intact without modification */}
        <div className="w-full">
          <FileDropzone
            label="Drop files here"
            description="Drag & drop files or click to browse"
            multiple
            onUpload={handleUpload}
            onFilesChange={(files) => {
              if (files.length === 0) {
                setHasUploaded(false);
                setCurrentFile(null);
              } else {
                setCurrentFile(files[0]);
                setActiveFileName(files[0].name);
                setActiveFileSize(files[0].size);
              }
            }}
          />
        </div>

        {/* Existing Action Button: Preserved styling and motion entrance */}
        <AnimatePresence>
          {hasUploaded && (
            <motion.div
              initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full flex justify-center pt-2"
            >
              <ActionButton
                label="Continue to Acrobat Viewer"
                pendingLabel="Processing OCR & De-skewing..."
                successLabel="Ready"
                onAction={handleContinue}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Sample Scanned Documents for instant testing */}
        <div className="w-full pt-4 border-t border-neutral-200/80 mt-2">
          <div className="text-[11px] font-medium text-neutral-400 mb-2 flex items-center justify-between">
            <span>Or test with a pre-scanned sample:</span>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 size={11} /> Auto De-skew &amp; OCR Ready
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {SAMPLE_DOCUMENTS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample.id)}
                className="flex items-start gap-2.5 p-2.5 rounded-lg border border-neutral-200 hover:border-red-400 bg-white hover:bg-red-50/20 text-left transition group cursor-pointer shadow-sm"
              >
                <div className="w-7 h-7 rounded bg-red-100 text-red-600 flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:text-white transition">
                  <FileText size={15} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-neutral-800 truncate group-hover:text-red-700">
                    {sample.name}
                  </div>
                  <div className="text-[10px] text-neutral-500 line-clamp-1">
                    {sample.imperfections[0]}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
