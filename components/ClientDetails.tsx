
import React, { useState } from 'react';
import { Invoice, Client, InvoiceStatus } from '../types';
import { Icons } from '../constants';

interface ClientDetailsProps {
  client: Client;
  invoices: Invoice[];
  onBack: () => void;
  onEditInvoice: (id: string) => void;
  onDeleteInvoice: (id: string) => void;
  onDownloadInvoice: (id: string) => void;
  onCreateInvoice: (client: Client) => void;
  onUpdateStatus: (id: string, status: InvoiceStatus) => void;
}

const ClientDetails: React.FC<ClientDetailsProps> = ({ client, invoices, onBack, onEditInvoice, onDeleteInvoice, onDownloadInvoice, onCreateInvoice, onUpdateStatus }) => {
  const totalVolume = invoices.reduce((sum, inv) => {
    const subtotal = inv.items.reduce((s, i) => s + i.total, 0);
    return sum + (subtotal * (1 + inv.taxRate / 100) - inv.discount);
  }, 0);

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteInvoice(id);
  };

  return (
    <div className="space-y-6 md:space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div className="flex items-center gap-4 md:gap-6">
          <button 
            onClick={onBack}
            className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Icons.ChevronRight className="w-5 h-5 md:w-6 md:h-6 rotate-180 text-slate-600" />
          </button>
          <div className="min-w-0">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight truncate">{client.name}</h2>
            <p className="text-slate-500 mt-1 font-medium text-xs md:text-base">Customer Profile & Management</p>
          </div>
        </div>
        <button 
          onClick={() => onCreateInvoice(client)}
          className="bg-indigo-600 text-white px-6 py-4 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-bold text-sm md:text-base flex items-center justify-center gap-3 transition-all hover:bg-indigo-700 active:scale-95 group"
        >
          <Icons.New className="w-4 h-4 md:w-5 md:h-5" />
          Create Invoice
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-1 space-y-6 md:space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 md:space-y-8">
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Billing Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">GSTIN / UIN</label>
                  <p className="text-sm font-black text-black">{client.gstin || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Address</label>
                  <p className="text-sm font-bold text-black whitespace-pre-wrap leading-relaxed">{client.address || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">State</label>
                    <p className="text-sm font-black text-black uppercase">{client.stateName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Code</label>
                    <p className="text-sm font-black text-black">{client.stateCode || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Contact</label>
                  <p className="text-sm font-bold text-black">{client.phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="pt-6 md:pt-8 border-t border-slate-100 space-y-4 md:space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Key Metrics</h3>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="bg-slate-50 p-4 md:p-5 rounded-xl md:rounded-2xl">
                  <p className="text-[8px] md:text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Bills</p>
                  <p className="text-xl md:text-2xl font-black text-black">{invoices.length}</p>
                </div>
                <div className="bg-indigo-50 p-4 md:p-5 rounded-xl md:rounded-2xl">
                  <p className="text-[8px] md:text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">Volume</p>
                  <p className="text-sm md:text-lg font-black text-indigo-600 truncate">₹{totalVolume.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 md:px-8 py-4 md:py-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">Billing History</h3>
              <span className="hidden md:block text-xs font-bold text-slate-400">Linked transactions</span>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left min-w-[600px] md:min-w-0">
                <thead className="bg-slate-50 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <tr>
                    <th className="px-6 md:px-8 py-3 md:py-4">Number</th>
                    <th className="px-6 md:px-8 py-3 md:py-4">Date</th>
                    <th className="px-6 md:px-8 py-3 md:py-4 text-right">Amount</th>
                    <th className="px-6 md:px-8 py-3 md:py-4 text-center">Status</th>
                    <th className="px-6 md:px-8 py-3 md:py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.length > 0 ? invoices.map((inv) => {
                    const subtotal = inv.items.reduce((s, i) => s + i.total, 0);
                    const total = subtotal * (1 + inv.taxRate / 100) - inv.discount;
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 md:px-8 py-4 md:py-5 font-black text-xs md:text-sm text-black">#{inv.invoiceNumber}</td>
                        <td className="px-6 md:px-8 py-4 md:py-5 text-xs md:text-sm font-bold text-slate-600 whitespace-nowrap">
                          {new Date(inv.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </td>
                        <td className="px-6 md:px-8 py-4 md:py-5 text-right font-black text-xs md:text-sm text-black whitespace-nowrap">₹{total.toLocaleString('en-IN')}</td>
                        <td className="px-6 md:px-8 py-4 md:py-5 text-center">
                          <select 
                            value={inv.status}
                            onChange={(e) => onUpdateStatus(inv.id, e.target.value as InvoiceStatus)}
                            className={`px-2 py-1 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer transition-all border-none ${
                              inv.status === 'Finished' ? 'bg-emerald-50 text-emerald-700' : 
                              inv.status === 'Delayed' ? 'bg-rose-50 text-rose-700' : 'bg-indigo-50 text-indigo-700'
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Finished">Finished</option>
                            <option value="Delayed">Delayed</option>
                          </select>
                        </td>
                        <td className="px-6 md:px-8 py-4 md:py-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2 md:gap-3">
                            <button onClick={(e) => handleActionClick(e, () => onDownloadInvoice(inv.id))} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-white border border-slate-200 rounded-lg md:rounded-xl text-emerald-600 hover:bg-emerald-50 active:scale-95 transition-all">
                              <Icons.Download className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                            <button onClick={(e) => handleActionClick(e, () => onEditInvoice(inv.id))} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-white border border-slate-200 rounded-lg md:rounded-xl text-indigo-600 hover:bg-indigo-50 active:scale-95 transition-all">
                              <Icons.Edit className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                            <button onClick={(e) => handleDeleteClick(e, inv.id)} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center border rounded-lg md:rounded-xl active:scale-95 bg-white border-slate-200 text-rose-600 hover:bg-rose-50 transition-all">
                              <Icons.Delete className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={5} className="px-8 py-10 md:py-20 text-center text-slate-400 font-bold text-sm">
                        No transactions recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;
