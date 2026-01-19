
import React, { useMemo, useState } from 'react';
import { Invoice, Client } from '../types';
import { Icons } from '../constants';

interface ClientListProps {
  clients: Client[];
  invoices: Invoice[];
  onViewClient: (client: Client) => void;
  onDeleteClient?: (id: string) => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, invoices, onViewClient, onDeleteClient }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const clientStats = useMemo(() => {
    const statsMap = new Map<string, { count: number; total: number; latestStatus: string }>();

    invoices.forEach(inv => {
      const current = statsMap.get(inv.client_id || '') || { count: 0, total: 0, latestStatus: inv.status };
      statsMap.set(inv.client_id || '', {
        count: current.count + 1,
        total: current.total + (inv.total_amount || 0),
        latestStatus: inv.status
      });
    });

    return statsMap;
  }, [invoices]);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.gstin && c.gstin.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Client Hub</h2>
          <p className="text-slate-500 mt-1 font-medium text-sm md:text-base">Unified view of all business entities.</p>
        </div>
        <div className="relative group w-full md:w-auto">
          <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search entities..." 
            className="pl-12 pr-6 py-3 md:py-4 bg-white border border-slate-200 rounded-xl md:rounded-2xl w-full md:w-96 focus:ring-4 focus:ring-indigo-100 outline-none shadow-sm transition-all text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredClients.map((client) => {
            const stats = clientStats.get(client.id!) || { count: 0, total: 0, latestStatus: 'None' };
            return (
              <div 
                key={client.id} 
                onClick={() => onViewClient(client)}
                className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-col h-full"
              >
                <div className="flex items-start justify-between mb-4 md:mb-6">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-indigo-50 rounded-xl md:rounded-2xl flex items-center justify-center text-indigo-600 font-black text-lg md:text-xl group-hover:scale-105 transition-transform shrink-0">
                    {client.name.substring(0, 1).toUpperCase()}
                  </div>
                  <div className={`px-3 py-1 md:px-4 md:py-1.5 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${
                    stats.latestStatus === 'Finished' ? 'bg-emerald-600 text-white' : 
                    stats.latestStatus === 'Delayed' ? 'bg-rose-600 text-white' : 
                    stats.latestStatus === 'Pending' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {stats.count} Bills • {stats.latestStatus}
                  </div>
                </div>
                
                <div className="flex-1 space-y-3 md:space-y-4">
                  <div className="min-w-0">
                    <h3 className="text-lg md:text-xl font-black text-black leading-tight group-hover:text-indigo-600 truncate transition-colors">{client.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">GSTIN:</span>
                      <span className="text-[11px] md:text-xs font-bold text-black truncate">{client.gstin || 'UNREGISTERED'}</span>
                    </div>
                  </div>

                  <div className="pt-4 md:pt-6 mt-4 md:mt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Volume</p>
                      <p className="text-lg md:text-xl font-black text-black truncate">₹{stats.total.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex gap-2 shrink-0 ml-4">
                       <button 
                         onClick={(e) => { e.stopPropagation(); }} 
                         className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 active:scale-90 transition-all"
                       >
                         <Icons.Edit className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={(e) => { e.stopPropagation(); if(onDeleteClient && client.id) onDeleteClient(client.id); }} 
                         className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-rose-600 hover:bg-rose-50 active:scale-90 transition-all"
                       >
                         <Icons.Delete className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-10 md:p-24 text-center border border-slate-200 shadow-sm">
           <Icons.Clients className="w-12 h-12 md:w-16 md:h-16 text-slate-200 mx-auto mb-4 md:mb-6" />
           <h3 className="text-lg md:text-xl font-bold text-slate-900">Entity Not Found</h3>
           <p className="text-slate-500 mt-2 text-sm">Historical records populate this list automatically.</p>
        </div>
      )}
    </div>
  );
};

export default ClientList;
