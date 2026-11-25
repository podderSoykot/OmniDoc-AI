'use client';

import React, { useState, useMemo } from 'react';
import { 
  Table2, 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Filter,
  Layers,
  Database
} from 'lucide-react';

interface SpreadsheetViewerProps {
  sheets: Record<string, Array<Record<string, any>>>;
  filename: string;
  documentId?: string;
}

export default function SpreadsheetViewer({ sheets, filename, documentId }: SpreadsheetViewerProps) {
  const sheetNames = useMemo(() => Object.keys(sheets || {}), [sheets]);
  const [activeSheet, setActiveSheet] = useState<string>(sheetNames[0] || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Switch active sheet if current selection isn't in sheetNames
  React.useEffect(() => {
    if (sheetNames.length > 0 && !sheetNames.includes(activeSheet)) {
      setActiveSheet(sheetNames[0]);
    }
  }, [sheetNames, activeSheet]);

  // Reset page when switching sheet or changing search
  const handleSheetChange = (sheet: string) => {
    setActiveSheet(sheet);
    setCurrentPage(1);
    setSearchQuery('');
    setSortColumn(null);
  };

  const rawRows = useMemo(() => {
    return sheets[activeSheet] || [];
  }, [sheets, activeSheet]);

  const columns = useMemo(() => {
    if (rawRows.length === 0) return [];
    return Object.keys(rawRows[0]);
  }, [rawRows]);

  // Calculate quick summary metrics for the sheet
  const sheetStats = useMemo(() => {
    const totalRows = rawRows.length;
    const totalCols = columns.length;
    
    // Find numeric columns for potential sums
    let numericSumColumn = '';
    let numericTotal = 0;
    
    const candidateColumns = ['GrandTotal', 'TotalAmount', 'DebitAmount', 'amount', 'Total', 'Subtotal'];
    for (const cand of candidateColumns) {
      const match = columns.find(c => c.toLowerCase() === cand.toLowerCase());
      if (match) {
        numericSumColumn = match;
        numericTotal = rawRows.reduce((acc, row) => {
          const val = parseFloat(String(row[match]).replace(/[^0-9.-]+/g, ''));
          return acc + (isNaN(val) ? 0 : val);
        }, 0);
        break;
      }
    }

    return { totalRows, totalCols, numericSumColumn, numericTotal };
  }, [rawRows, columns]);

  // Filter rows by search query
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rawRows;
    const q = searchQuery.toLowerCase().trim();
    return rawRows.filter(row => {
      return Object.values(row).some(val => 
        String(val ?? '').toLowerCase().includes(q)
      );
    });
  }, [rawRows, searchQuery]);

  // Sort rows
  const sortedRows = useMemo(() => {
    if (!sortColumn) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const valA = a[sortColumn];
      const valB = b[sortColumn];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      // Numeric comparison
      const numA = Number(valA);
      const numB = Number(valB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      // String comparison
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortColumn, sortDirection]);

  // Paginated rows
  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  // Export current sheet to CSV
  const handleExportCSV = () => {
    if (rawRows.length === 0) return;
    const header = columns.join(',');
    const rows = rawRows.map(r => 
      columns.map(c => {
        const val = String(r[c] ?? '').replace(/"/g, '""');
        return `"${val}"`;
      }).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename.replace(/\.[^/.]+$/, '')}_${activeSheet}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render cell with formatting heuristics
  const renderCell = (col: string, value: any) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-slate-300 italic text-xs">—</span>;
    }

    const valStr = String(value);
    const lowerCol = col.toLowerCase();

    // Status badges
    if (lowerCol.includes('status') || lowerCol.includes('approval') || lowerCol.includes('reconcil')) {
      const isPositive = /paid|approved|matched|reconciled|success/i.test(valStr);
      const isWarning = /pending|processing|review|partial/i.test(valStr);
      const isNegative = /failed|rejected|unmatched|discrepancy/i.test(valStr);

      if (isPositive) {
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            {valStr}
          </span>
        );
      }
      if (isWarning) {
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
            {valStr}
          </span>
        );
      }
      if (isNegative) {
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
            {valStr}
          </span>
        );
      }
    }

    // Currency / Amount formatting
    const isCurrencyCol = /price|amount|total|subtotal|debit|credit|balance|cost/i.test(lowerCol);
    const num = Number(valStr);
    if (isCurrencyCol && !isNaN(num)) {
      const isNegative = num < 0;
      return (
        <span className={`font-mono text-xs font-semibold ${isNegative ? 'text-rose-600' : 'text-slate-800'}`}>
          {num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      );
    }

    return <span className="text-xs text-slate-700">{valStr}</span>;
  };

  if (sheetNames.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <Table2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-700">No spreadsheet sheets found.</p>
        <p className="text-xs text-slate-400 mt-1">This workbook contains no populated worksheets.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sheet Tabs Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-2xs">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 px-3 py-2 mr-1">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Worksheets:</span>
            </div>
            {sheetNames.map((name) => {
              const count = sheets[name]?.length || 0;
              const isActive = activeSheet === name;
              return (
                <button
                  key={name}
                  onClick={() => handleSheetChange(name)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                  }`}
                >
                  <Table2 className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 ml-auto pr-1">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-xl shadow-2xs transition"
              title="Export active sheet to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export Sheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards for active sheet */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Sheet Records</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">{sheetStats.totalRows.toLocaleString()}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Database className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Columns</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">{sheetStats.totalCols}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Table2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {sheetStats.numericSumColumn ? `Sum (${sheetStats.numericSumColumn})` : 'Filtered Match Count'}
            </p>
            <p className="text-lg font-black text-emerald-600 mt-0.5">
              {sheetStats.numericSumColumn 
                ? `$${sheetStats.numericTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `${filteredRows.length.toLocaleString()} rows`
              }
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs">
            {sheetStats.numericSumColumn ? '$' : '#'}
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
        {/* Table Search & Controls Bar */}
        <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${activeSheet} rows...`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 justify-between sm:justify-end">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-600">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="text-xs text-slate-400 font-medium">
              Showing <span className="font-bold text-slate-700">{sortedRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span>-
              <span className="font-bold text-slate-700">{Math.min(currentPage * pageSize, sortedRows.length)}</span> of{' '}
              <span className="font-bold text-slate-700">{sortedRows.length}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Data Grid */}
        <div className="overflow-x-auto max-h-[600px] divide-y divide-slate-100">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/90 backdrop-blur-xs sticky top-0 z-10 border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-3 text-[11px] font-black uppercase tracking-wider text-slate-400 text-center w-12 border-r border-slate-200/50">
                  #
                </th>
                {columns.map((col) => {
                  const isSorted = sortColumn === col;
                  const isCurrency = /price|amount|total|subtotal|debit|credit|balance|cost/i.test(col);
                  return (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      className={`py-3 px-4 text-[11px] font-black uppercase tracking-wider text-slate-500 cursor-pointer select-none hover:bg-slate-100/80 transition-colors ${
                        isCurrency ? 'text-right' : 'text-left'
                      }`}
                    >
                      <div className={`inline-flex items-center gap-1.5 ${isCurrency ? 'flex-row-reverse' : ''}`}>
                        <span>{col}</span>
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-60 group-hover:opacity-100" />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-12 text-center text-slate-400 text-xs">
                    No rows match your query <span className="font-semibold text-slate-600">"{searchQuery}"</span>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr
                      key={idx}
                      className="hover:bg-indigo-50/30 transition-colors group"
                    >
                      <td className="py-2.5 px-3 text-[11px] font-mono text-slate-400 text-center border-r border-slate-100 bg-slate-50/30 group-hover:bg-transparent">
                        {globalIdx}
                      </td>
                      {columns.map((col) => {
                        const isCurrency = /price|amount|total|subtotal|debit|credit|balance|cost/i.test(col);
                        return (
                          <td
                            key={col}
                            className={`py-2.5 px-4 whitespace-nowrap text-xs ${
                              isCurrency ? 'text-right' : 'text-left'
                            }`}
                          >
                            {renderCell(col, row[col])}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 bg-slate-50/70 border-t border-slate-200/80 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-slate-500 font-medium">
            Page <span className="font-bold text-slate-800">{currentPage}</span> of{' '}
            <span className="font-bold text-slate-800">{totalPages}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg border border-indigo-100">
              {currentPage}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
