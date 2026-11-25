'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { DocumentItem } from '@/lib/types';
import StatCard from '@/components/dashboard/StatCard';
import DocumentTable from '@/components/dashboard/DocumentTable';
import { FileText, CheckCircle, AlertTriangle, UploadCloud, Search } from 'lucide-react';

export default function DashboardPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const data = await api.listDocuments(searchQuery, statusFilter);
      setDocuments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocs();
  };

  const totalDocs = documents.length;
  const passedDocs = documents.filter((d) => d.review_status === 'PASSED').length;
  const reviewNeeded = documents.filter((d) => d.review_status === 'NEEDS_MANUAL_REVIEW').length;
  const warningDocs = documents.filter((d) => d.review_status === 'WARNING').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial Document Intelligence</h1>
          <p className="text-sm text-slate-500 mt-0.5">Automated extraction, OCR, cross-verification, and business rule validation.</p>
        </div>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm transition"
        >
          <UploadCloud className="w-4 h-4" /> Upload New Batch
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Processed" value={totalDocs} icon={<FileText className="w-5 h-5" />} />
        <StatCard title="Passed Rules" value={passedDocs} subtitle="100% Valid Math" icon={<CheckCircle className="w-5 h-5" />} color="bg-emerald-50 text-emerald-600" />
        <StatCard title="Manual Review" value={reviewNeeded} subtitle="Discrepancies found" icon={<AlertTriangle className="w-5 h-5" />} color="bg-rose-50 text-rose-600" />
        <StatCard title="Warnings" value={warningDocs} subtitle="Minor field alerts" icon={<AlertTriangle className="w-5 h-5" />} color="bg-amber-50 text-amber-600" />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search by invoice #, supplier, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Validation Statuses</option>
            <option value="PASSED">Passed Only</option>
            <option value="NEEDS_MANUAL_REVIEW">Needs Review</option>
            <option value="WARNING">Warnings</option>
          </select>
          <button
            onClick={fetchDocs}
            className="text-xs bg-slate-100 hover:bg-slate-200 font-semibold px-3 py-2 rounded-lg text-slate-700 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          Loading documents...
        </div>
      ) : (
        <DocumentTable documents={documents} />
      )}
    </div>
  );
}
