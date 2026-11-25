import React, { useState } from 'react';
import { StructuredInvoiceData, LineItem } from '@/lib/types';
import { Save, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface ExtractedFormProps {
  data: StructuredInvoiceData;
  confidences?: Record<string, number> | null;
  onSave: (data: StructuredInvoiceData) => void;
  isSaving: boolean;
}

export default function ExtractedForm({ data, confidences, onSave, isSaving }: ExtractedFormProps) {
  const [formData, setFormData] = useState<StructuredInvoiceData>(data);

  const handleChange = (field: keyof StructuredInvoiceData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLineItemChange = (idx: number, field: keyof LineItem, value: any) => {
    const updated = [...formData.line_items];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === 'quantity' || field === 'unit_price') {
      const q = field === 'quantity' ? Number(value) : updated[idx].quantity;
      const u = field === 'unit_price' ? Number(value) : updated[idx].unit_price;
      updated[idx].amount = round(q * u);
    }
    setFormData((prev) => ({ ...prev, line_items: updated }));
  };

  const addLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      line_items: [...prev.line_items, { description: '', quantity: 1, unit_price: 0, amount: 0 }],
    }));
  };

  const removeLineItem = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      line_items: prev.line_items.filter((_, i) => i !== idx),
    }));
  };

  const round = (val: number) => Math.round(val * 100) / 100;

  const confBadge = (field: string) => {
    const score = confidences?.[field];
    if (score === undefined) return null;
    const pct = Math.round(score * 100);
    const color = pct >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : pct >= 50 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-rose-700 bg-rose-50 border-rose-200';
    return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${color}`}>{pct}% conf</span>;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-black text-slate-900 tracking-tight">Structured Invoice Fields</h3>
          <p className="text-[11px] text-slate-400">Zero-hallucination extraction with field-level confidence ratings</p>
        </div>
        <button
          onClick={() => onSave(formData)}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl shadow-sm transition disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" /> {isSaving ? 'Re-Validating...' : 'Save & Re-Validate'}
        </button>
      </div>

      {/* Main Metadata Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <label className="font-bold text-slate-600 flex items-center justify-between mb-1">
            <span>Invoice Number</span> {confBadge('invoice_number')}
          </label>
          <input
            type="text"
            value={formData.invoice_number || ''}
            onChange={(e) => handleChange('invoice_number', e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-800 bg-slate-50/50 focus:bg-white transition"
          />
        </div>
        <div>
          <label className="font-bold text-slate-600 flex items-center justify-between mb-1">
            <span>Invoice Date</span> {confBadge('invoice_date')}
          </label>
          <input
            type="text"
            value={formData.invoice_date || ''}
            onChange={(e) => handleChange('invoice_date', e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-800 bg-slate-50/50 focus:bg-white transition"
          />
        </div>
        <div>
          <label className="font-bold text-slate-600 flex items-center justify-between mb-1">
            <span>Supplier / Vendor</span> {confBadge('supplier_name')}
          </label>
          <input
            type="text"
            value={formData.supplier_name || ''}
            onChange={(e) => handleChange('supplier_name', e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-800 bg-slate-50/50 focus:bg-white transition"
          />
        </div>
        <div>
          <label className="font-bold text-slate-600 flex items-center justify-between mb-1">
            <span>Customer Name</span> {confBadge('customer_name')}
          </label>
          <input
            type="text"
            value={formData.customer_name || ''}
            onChange={(e) => handleChange('customer_name', e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-800 bg-slate-50/50 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Totals Summary */}
      <div className="grid grid-cols-3 gap-3 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
        <div>
          <label className="font-bold text-slate-500 block mb-1">Subtotal</label>
          <input
            type="number"
            step="0.01"
            value={formData.subtotal ?? ''}
            onChange={(e) => handleChange('subtotal', parseFloat(e.target.value) || 0)}
            className="w-full border border-slate-200 rounded-lg p-2 font-bold text-slate-800 bg-white shadow-2xs"
          />
        </div>
        <div>
          <label className="font-bold text-slate-500 block mb-1">Tax / VAT</label>
          <input
            type="number"
            step="0.01"
            value={formData.tax ?? ''}
            onChange={(e) => handleChange('tax', parseFloat(e.target.value) || 0)}
            className="w-full border border-slate-200 rounded-lg p-2 font-bold text-slate-800 bg-white shadow-2xs"
          />
        </div>
        <div>
          <label className="font-bold text-indigo-700 block mb-1">Total Amount</label>
          <input
            type="number"
            step="0.01"
            value={formData.total ?? ''}
            onChange={(e) => handleChange('total', parseFloat(e.target.value) || 0)}
            className="w-full border border-indigo-300 rounded-lg p-2 font-black text-indigo-700 bg-indigo-50/60 shadow-2xs"
          />
        </div>
      </div>

      {/* Line Items Table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
            Line Items ({formData.line_items.length})
          </h4>
          <button
            type="button"
            onClick={addLineItem}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Row
          </button>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {formData.line_items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60 text-xs">
              <input
                type="text"
                placeholder="Item description"
                value={item.description}
                onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                className="col-span-5 border border-slate-200 rounded-lg p-2 bg-white font-medium"
              />
              <input
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => handleLineItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                className="col-span-2 border border-slate-200 rounded-lg p-2 bg-white font-medium text-center"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price"
                value={item.unit_price}
                onChange={(e) => handleLineItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                className="col-span-2 border border-slate-200 rounded-lg p-2 bg-white font-medium text-center"
              />
              <div className="col-span-2 font-bold text-slate-800 text-right pr-1">
                ${Number(item.amount).toFixed(2)}
              </div>
              <button
                type="button"
                onClick={() => removeLineItem(idx)}
                className="col-span-1 text-slate-400 hover:text-rose-500 transition p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
