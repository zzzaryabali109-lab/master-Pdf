import { useState, useMemo, useDeferredValue, useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, FileSpreadsheet, Sparkles, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import * as XLSX from 'xlsx'
import FileDropzone, { FileDropzoneUpload } from '@/components/arc/file-dropzone/file-dropzone'
import ActionButton from '@/components/arc/action-button/action-button'
import SortableDataTable, { DataColumn } from '@/components/arc/sortable-data-table/sortable-data-table'
import ThemeSwitch from '@/components/arc/theme-switch/theme-switch'
import { processExcelWorkbook, ExcelRow, SheetData } from './services/excelEngine'

const SAMPLE_EXCEL_DATA: ExcelRow[] = [
  { __id: '1', 'Product Name': 'Quantum Laptop Pro', Category: 'Electronics', SKU: 'ELEC-9021', 'Price ($)': 1299, Stock: 42, Status: 'In Stock' },
  { __id: '2', 'Product Name': 'ErgoDesk Height Adjustable', Category: 'Furniture', SKU: 'FURN-3310', 'Price ($)': 649, Stock: 18, Status: 'Low Stock' },
  { __id: '3', 'Product Name': 'Noise-Cancelling Headphones', Category: 'Audio', SKU: 'AUD-5524', 'Price ($)': 249, Stock: 85, Status: 'In Stock' },
  { __id: '4', 'Product Name': '4K Ultra-Wide Monitor 34"', Category: 'Electronics', SKU: 'ELEC-1188', 'Price ($)': 799, Stock: 12, Status: 'Low Stock' },
  { __id: '5', 'Product Name': 'Mechanical Keyboard RGB', Category: 'Peripherals', SKU: 'PER-4402', 'Price ($)': 139, Stock: 120, Status: 'In Stock' },
  { __id: '6', 'Product Name': 'Wireless Ergonomic Mouse', Category: 'Peripherals', SKU: 'PER-8819', 'Price ($)': 79, Stock: 0, Status: 'Out of Stock' },
  { __id: '7', 'Product Name': 'Thunderbolt 4 Docking Station', Category: 'Accessories', SKU: 'ACC-7731', 'Price ($)': 199, Stock: 35, Status: 'In Stock' },
  { __id: '8', 'Product Name': 'Leather Executive Chair', Category: 'Furniture', SKU: 'FURN-2244', 'Price ($)': 499, Stock: 8, Status: 'Low Stock' },
]

export default function App() {
  const [currentPage, setCurrentPage] = useState<'upload' | 'table'>('upload')
  const [hasUploaded, setHasUploaded] = useState(false)
  const [fileName, setFileName] = useState<string>('')
  const [sheetName, setSheetName] = useState<string>('')
  const [availableSheets, setAvailableSheets] = useState<string[]>([])
  const [sheetsData, setSheetsData] = useState<Record<string, SheetData>>({})
  const [rows, setRows] = useState<ExcelRow[]>([])
  const [columns, setColumns] = useState<DataColumn<ExcelRow>[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearch = useDeferredValue(searchQuery)

  const [pageIndex, setPageIndex] = useState(1)
  const [pageSize, setPageSize] = useState<number>(50)

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme')
      if (saved === 'dark' || saved === 'light') return saved
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    root.style.colorScheme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  const handleThemeChange = (next: 'light' | 'dark') => {
    setTheme(next)
  }

  const parseExcelFile = async (file: File) => {
    try {
      const result = await processExcelWorkbook(file)
      if (result.rows.length > 0 && result.columns.length > 0) {
        setSheetName(result.sheetName)
        setColumns(result.columns)
        setRows(result.rows)
        setAvailableSheets(result.availableSheets)
        setSheetsData(result.sheets)
        setPageIndex(1)
      }
    } catch (err) {
      console.error('Error parsing Excel file:', err)
    }
  }

  const handleUpload: FileDropzoneUpload = async (item, { onProgress }) => {
    setFileName(item.name)
    for (let p = 20; p <= 100; p += 20) {
      await new Promise((r) => setTimeout(r, 60))
      onProgress(p)
    }
    if (item.file) {
      await parseExcelFile(item.file)
    }
    setHasUploaded(true)
  }

  const loadSampleData = () => {
    setFileName('sample_products.xlsx')
    setSheetName('Inventory')
    setAvailableSheets(['Inventory'])
    const cols: DataColumn<ExcelRow>[] = [
      { key: 'Product Name', label: 'Product Name', sortable: true, width: 280 },
      { key: 'Category', label: 'Category', sortable: true, width: 170 },
      { key: 'SKU', label: 'SKU', sortable: true, width: 160 },
      {
        key: 'Price ($)',
        label: 'Price ($)',
        sortable: true,
        numeric: true,
        width: 140,
        render: (val) => (typeof val === 'number' ? `$${val.toLocaleString()}` : String(val ?? '—')),
      },
      {
        key: 'Stock',
        label: 'Stock',
        sortable: true,
        numeric: true,
        width: 130,
        render: (val) => (typeof val === 'number' ? val.toLocaleString() : String(val ?? '—')),
      },
      {
        key: 'Status',
        label: 'Status',
        sortable: true,
        width: 170,
        render: (val) => {
          const s = String(val ?? '')
          const isGreen = s.toLowerCase().includes('in stock')
          const isRed = s.toLowerCase().includes('out of stock')
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isGreen
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                  : isRed
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25'
              }`}
            >
              {s}
            </span>
          )
        },
      },
    ]
    setColumns(cols)
    setRows(SAMPLE_EXCEL_DATA)
    setSheetsData({
      Inventory: {
        sheetName: 'Inventory',
        totalRows: SAMPLE_EXCEL_DATA.length,
        totalColumns: cols.length,
        columns: cols,
        rows: SAMPLE_EXCEL_DATA,
      },
    })
    setPageIndex(1)
    setHasUploaded(true)
    setCurrentPage('table')
  }

  const handleExportData = () => {
    try {
      const cleanData = rows.map(({ __id, ...rest }) => rest)
      const ws = XLSX.utils.json_to_sheet(cleanData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, sheetName || 'ExtractedData')
      XLSX.writeFile(wb, `${fileName.replace(/\.[^/.]+$/, '') || 'exported'}_cleaned.xlsx`)
    } catch (e) {
      console.error('Export error:', e)
    }
  }

  const handleContinue = async () => {
    if (rows.length === 0) {
      loadSampleData()
      return
    }
    await new Promise((r) => setTimeout(r, 400))
    setCurrentPage('table')
  }

  const filteredRows = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) =>
      Object.entries(row).some(
        ([k, v]) => k !== '__id' && String(v ?? '').toLowerCase().includes(q)
      )
    )
  }, [rows, deferredSearch])

  const totalFilteredCount = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / pageSize))

  const paginatedRows = useMemo(() => {
    const start = (pageIndex - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, pageIndex, pageSize])

  const startRecordNum = totalFilteredCount > 0 ? (pageIndex - 1) * pageSize + 1 : 0
  const endRecordNum = Math.min(pageIndex * pageSize, totalFilteredCount)

  return (
    <div className="min-h-screen w-full bg-background text-foreground transition-colors duration-200 relative">
      {/* Top Right Corner Theme Switcher */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeSwitch
          theme={theme}
          onThemeChange={handleThemeChange}
          iconOnly
        />
      </div>

      <AnimatePresence mode="wait">
        {currentPage === 'upload' ? (
          <motion.div
            key="upload-page"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6"
          >
            <div className="w-full max-w-lg flex flex-col items-center gap-5">
              <div className="text-center space-y-1.5 mb-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Excel & CSV Viewer
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Upload Excel File</h1>
                <p className="text-sm text-muted-foreground">
                  Drag and drop your spreadsheet (.xlsx, .xls, .csv) to view and sort all its data.
                </p>
              </div>

              <div className="w-full">
                <FileDropzone
                  accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                  label="Drop your Excel file here"
                  description="Supports .xlsx, .xls, and .csv files"
                  onUpload={handleUpload}
                  onFilesChange={(files) => {
                    if (files.length === 0) {
                      setHasUploaded(false)
                      setRows([])
                      setColumns([])
                    }
                  }}
                />
              </div>

              <AnimatePresence>
                {hasUploaded && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="w-full flex flex-col items-center gap-2 pt-2"
                  >
                    <ActionButton
                      label="Continue"
                      pendingLabel="Loading Table..."
                      successLabel="Opening..."
                      onAction={handleContinue}
                    />
                    <span className="text-xs text-muted-foreground">
                      Click Continue to view all Excel columns and records
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {!hasUploaded && (
                <button
                  type="button"
                  onClick={loadSampleData}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer mt-2 underline-offset-4 hover:underline"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Don't have a file? View sample Excel data
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="table-page"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-[97vw] xl:max-w-[1750px] mx-auto px-3 sm:px-6 lg:px-8 py-6 flex flex-col gap-5"
          >
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-border">
              <button
                type="button"
                onClick={() => setCurrentPage('upload')}
                className="p-2 rounded-lg border border-border hover:bg-accent transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                title="Back to upload"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPageIndex(1)
                  }}
                  placeholder="Search across all columns..."
                  className="w-56 sm:w-72 px-3 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setPageIndex(1)
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>

            {/* Table Container */}
            <div className="w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden p-2 sm:p-4">
              {columns.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <SortableDataTable
                    rows={paginatedRows}
                    columns={columns}
                    rowKey={(row) => row.__id}
                    selectable
                    caption={fileName ? `Data extracted from ${fileName}` : 'Spreadsheet Records'}
                    emptyMessage={searchQuery ? 'No matching records found for your search.' : 'No data available.'}
                    itemName={{ one: 'record', other: 'records' }}
                  />

                  {/* High-Performance Pagination Bar */}
                  {totalFilteredCount > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 px-1 text-xs text-muted-foreground border-t border-border">
                      <div className="flex items-center gap-2">
                        <span>
                          Showing <strong className="text-foreground font-medium">{startRecordNum}</strong> to{' '}
                          <strong className="text-foreground font-medium">{endRecordNum}</strong> of{' '}
                          <strong className="text-foreground font-medium">{totalFilteredCount.toLocaleString()}</strong> records
                        </span>
                        {totalFilteredCount < rows.length && (
                          <span className="text-[11px] text-amber-500">
                            (filtered from {rows.length.toLocaleString()} total)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Rows per page selector */}
                        <div className="flex items-center gap-1.5">
                          <span>Rows per page:</span>
                          <select
                            value={pageSize}
                            onChange={(e) => {
                              setPageSize(Number(e.target.value))
                              setPageIndex(1)
                            }}
                            className="bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none cursor-pointer"
                          >
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={250}>250</option>
                          </select>
                        </div>

                        {/* Page controls */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={pageIndex <= 1}
                            onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                            className="p-1 rounded border border-border hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                            title="Previous page"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>

                          <span className="px-2 font-mono">
                            Page {pageIndex} of {totalPages}
                          </span>

                          <button
                            type="button"
                            disabled={pageIndex >= totalPages}
                            onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                            className="p-1 rounded border border-border hover:bg-accent disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                            title="Next page"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No columns found in this spreadsheet.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
