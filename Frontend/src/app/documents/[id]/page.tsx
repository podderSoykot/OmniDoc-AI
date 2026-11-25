'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { DocumentDetail, StructuredInvoiceData } from '@/lib/types';
import DocumentPreview from '@/components/viewer/DocumentPreview';
import ExtractedForm from '@/components/viewer/ExtractedForm';
import ValidationBadges from '@/components/viewer/ValidationBadges';
import { ArrowLeft, RefreshCw } from 'lucide-react';

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchDoc = async () => {
    try {
      setLoading(true);
      const data = await api.getDocument(id);
      setDoc(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDoc();
  }, [id]);

  const handleSave = async (updatedData: StructuredInvoiceData) => {
    try {
      setSaving(true);
      const res = await api.saveCorrection(id, updatedData);
      alert('Changes saved and re-validated successfully!');
      fetchDoc();
    } catch (e: any) {
      alert(`Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading document details...</div>;
  }

  if (!doc) {
    return <div className="p-12 text-center text-rose-500">Document not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <button onClick={fetchDoc} className="text-xs flex items-center gap-1 text-slate-500 hover:text-indigo-600">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Document Preview */}
        <div className="lg:col-span-6">
          <DocumentPreview documentId={doc.id} fileType={doc.file_type} filename={doc.filename} />
        </div>

        {/* Right Side: Validation Audit & Extracted Form */}
        <div className="lg:col-span-6 space-y-6">
          <ValidationBadges validation={doc.validation} />
          {doc.structured_data && (
            <ExtractedForm
              data={doc.structured_data}
              confidences={doc.confidence_scores}
              onSave={handleSave}
              isSaving={saving}
            />
          )}
        </div>
      </div>
    </div>
  );
}
