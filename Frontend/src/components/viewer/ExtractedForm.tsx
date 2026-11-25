import React, { useState } from 'react';
import { StructuredInvoiceData, LineItem } from '@/lib/types';
import { Save, Plus, Trash2 } from 'lucide-react';

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
    const color = pct >= 80 ? 'text-emerald-600 bg-emerald-50' : pct >= 50 ? 'text-amber-600 bg-amber-50' : 'text-rose-600 bg-rose-50';
    return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${color}`}>{pct}% conf</span>;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-800">Extracted Invoice Details</h3>
        <button
          onClick={() => onSave(formData)}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg transition disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" /> {isSaving ? 'Saving...' : 'Save & Re-Validate'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <label className="font-semibold text-slate-600 flex items-center justify-between mb-1">
            Invoice Number {confBadge('invoice_number')}
          </label>
          <input
            type="text"
            value={formData.invoice_number || ''}
            onChange={(e) => handleChange('invoice_number', e.target.value)}
            className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800"
          />
        </div>
        <div>
          <label className="font-semibold text-slate-600 flex items-center justify-between mb-1">
            Invoice Date {confBadge('invoice_date')}
          </label>
          <input
            type="text"
            value={formData.invoice_date || ''}
            onChange={(e) => handleChange('invoice_date', e.target.value)}
            className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800"
          />
        </div>
        <div>
          <label className="font-semibold text-slate-600 flex items-center justify-between mb-1">
            Supplier Name {confBadge('supplier_name')}
          </label>
          <input
            type="text"
            value={formData.supplier_name || ''}
            onChange={(e) => handleChange('supplier_name', e.target.value)}
            className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800"
          />
        </div>
        <div>
          <label className="font-semibold text-slate-600 flex items-center justify-between mb-1">
            Customer Name {confBadge('customer_name')}
          </label>
          <input
            type="text"
            value={formData.customer_name || ''}
            onChange={(e) => handleChange('customer_name', e.target.value)}
            className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800"
          />
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
        <div>
          <label className="font-semibold text-slate-600 block mb-1">Subtotal</label>
          <input
            type="number"
            step="0.01"
            value={formData.subtotal ?? ''}
            onChange={(e) => handleChange('subtotal', parseFloat(e.target.value) || 0)}
            className="w-full border border-slate-200 rounded p-1.5 font-bold text-slate-800 bg-white"
          />
        </div>
        <div>
          <label className="font-semibold text-slate-600 block mb-1">Tax</label>
          <input
            type="number"
            step="0.01"
            value={formData.tax ?? ''}
            onChange={(e) => handleChange('tax', parseFloat(e.target.value) || 0)}
            className="w-full border border-slate-200 rounded p-1.5 font-bold text-slate-800 bg-white"
          />
        </div>
        <div>
          <label className="font-semibold text-slate-600 block mb-1">Grand Total</label>
          <input
            type="number"
            step="0.01"
            value={formData.total ?? ''}
            onChange={(e) => handleChange('total', parseFloat(e.target.value) || 0)}
            className="w-full border border-indigo-200 rounded p-1.5 font-black text-indigo-700 bg-indigo-50/50"
          />
        </div>
      </div>

      {/* Line Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold uppercase text-slate-600">Line Items ({formData.line_items.length})</h4>
          <button type="button" onClick={addLineItem} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {formData.line_items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded border border-slate-100 text-xs">
              <input
                type="text"
                placeholder="Description"
                value={item.description}
                onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                className="col-span-5 border border-slate-200 rounded p-1.5 bg-white"
              />
              <input
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => handleLineItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                className="col-span-2 border border-slate-200 rounded p-1.5 bg-white"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price"
                value={item.unit_price}
                onChange={(e) => handleLineItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                className="col-span-2 border border-slate-200 rounded p-1.5 bg-white"
              />
              <div className="col-span-2 font-bold text-slate-800 text-right pr-1">
                ${item.amount.toFixed(2)}
              </div>
              <button type="button" onClick={() => removeLineItem(idx)} className="col-span-1 text-slate-400 hover:text-rose-500">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
