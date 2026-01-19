
import React, { useState } from 'react';
import { Invoice } from '../types';
import { Icons } from '../constants';

interface InvoiceListProps {
  invoices: Invoice[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, onEdit, onDelete, onDownload }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvoices = invoices.filter(inv => 
    inv.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDelete(id);
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Billing Logs</h2>
          <p className="text-slate-500 mt-1 font-medium text-sm md:text-base">Historical record of all issued tax invoices.</p>
        </div>
        <div className="relative group w-full md:w-auto">
          <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search logs..." 
            className="pl-12 pr-6 py-3 md:py-4 bg-white border border-slate-200 rounded-xl md:rounded-2xl w-full md:w-96 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none shadow-sm transition-all text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-200/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px] lg:min-w-0">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
              <tr>
                <th className="px-6 md:px-8 py-4 md:py-5">Invoice #</th>
                <th className="px-6 md:px-8 py-4 md:py-5">Client Name</th>
                <th className="px-6 md:px-8 py-4 md:py-5">Issue Date</th>
                <th className="px-6 md:px-8 py-4 md:py-5">Amount</th>
                <th className="px-6 md:px-8 py-4 md:py-5">Status</th>
                <th className="px-6 md:px-8 py-4 md:py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length > 0 ? filteredInvoices.map((inv) => {
                const subtotal = inv.items.reduce((s, i) => s + i.total, 0);
                const tax = subtotal * (inv.taxRate / 100);
                const total = subtotal + tax - inv.discount;
                
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-6 md:px-8 py-4 md:py-6 font-bold text-slate-900 text-sm whitespace-nowrap">#{inv.invoiceNumber}</td>
                    <td className="px-6 md:px-8 py-4 md:py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-[10px] md:text-xs shrink-0">
                          {inv.client.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="max-w-[150px] md:max-w-[200px] truncate">
                          <div className="font-bold text-slate-900 text-sm truncate">{inv.client.name}</div>
                          <div className="text-[9px] md:text-[10px] text-slate-400 font-medium truncate">{inv.client.gstin}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 md:px-8 py-4 md:py-6 text-slate-500 text-sm font-semibold whitespace-nowrap">
                      {new Date(inv.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 md:px-8 py-4 md:py-6 font-black text-slate-900 text-sm whitespace-nowrap">₹{total.toLocaleString('en-IN')}</td>
                    <td className="px-6 md:px-8 py-4 md:py-6">
                      <span className={`px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 whitespace-nowrap ${
                        inv.status === 'Finished' ? 'bg-emerald-50 text-emerald-600' : 
                        inv.status === 'Delayed' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        <span className={`w-1 md:w-1.5 h-1 md:h-1.5 rounded-full ${
                          inv.status === 'Finished' ? 'bg-emerald-600' : 
                          inv.status === 'Delayed' ? 'bg-rose-600' : 'bg-indigo-600'
                        }`} />
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 md:px-8 py-4 md:py-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2 md:gap-3">
                        <button 
                          onClick={(e) => handleActionClick(e, () => onDownload(inv.id))} 
                          className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white border border-slate-200 rounded-xl md:rounded-2xl text-emerald-600 hover:bg-emerald-50 transition-all active:scale-95"
                        >
                          <Icons.Download className="w-5 h-5 md:w-[22px] md:h-[22px]" />
                        </button>
                        <button 
                          onClick={(e) => handleActionClick(e, () => onEdit(inv.id))} 
                          className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white border border-slate-200 rounded-xl md:rounded-2xl text-indigo-600 hover:bg-indigo-50 transition-all active:scale-95"
                        >
                          <Icons.Edit className="w-5 h-5 md:w-[22px] md:h-[22px]" />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteClick(e, inv.id)} 
                          className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center border rounded-xl md:rounded-2xl transition-all active:scale-95 bg-white border-slate-200 text-rose-600 hover:bg-rose-50"
                        >
                          <Icons.Delete className="w-5 h-5 md:w-[22px] md:h-[22px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-bold text-sm">
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoiceList;
