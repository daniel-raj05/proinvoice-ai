
import React, { useState, useMemo } from 'react';
import { Invoice } from '../types';
import { Icons } from '../constants';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  Legend
} from 'recharts';

interface DashboardProps {
  invoices: Invoice[];
  onNewInvoice: () => void;
  onEditInvoice: (id: string) => void;
}

type GraphType = 'Bar' | 'Line' | 'Pie';

const Dashboard: React.FC<DashboardProps> = ({ invoices, onNewInvoice, onEditInvoice }) => {
  const [graphType, setGraphType] = useState<GraphType>('Bar');

  const totalBilled = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const totalClients = new Set(invoices.map(i => i.client_id)).size;

  const pendingAmount = invoices
    .filter(inv => inv.status === 'Pending')
    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  const finishedCount = invoices.filter(inv => inv.status === 'Finished').length;
  const delayedCount = invoices.filter(inv => inv.status === 'Delayed').length;
  const pendingCount = invoices.filter(inv => inv.status === 'Pending').length;

  const chartData = useMemo(() => [
    { name: 'Finished', value: finishedCount, color: '#10b981' },
    { name: 'Pending', value: pendingCount, color: '#6366f1' },
    { name: 'Delayed', value: delayedCount, color: '#f43f5e' },
  ], [finishedCount, pendingCount, delayedCount]);

  const renderGraph = () => {
    if (graphType === 'Bar') {
      return (
        <BarChart data={chartData} barSize={60}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
          <Tooltip cursor={{fill: '#f8fafc', radius: 12}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }} />
          <Bar dataKey="value" radius={[12, 12, 12, 12]}>
            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
          </Bar>
        </BarChart>
      );
    } else if (graphType === 'Line') {
      return (
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
          <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }} />
          <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={5} dot={{ r: 7, fill: '#6366f1', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 9 }} />
        </LineChart>
      );
    } else {
      return (
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={8}
            dataKey="value"
          >
            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }} />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px' }} />
        </PieChart>
      );
    }
  };

  return (
    <div className="space-y-6 md:space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Analytics Hub</h2>
          <p className="text-slate-500 mt-1 font-medium text-sm md:text-base">Real-time performance metrics for your business infrastructure.</p>
        </div>
        <button 
          onClick={onNewInvoice}
          className="bg-slate-900 text-white px-6 py-4 md:px-8 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs flex items-center justify-center gap-3 transition-all hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-900/20 active:scale-95 group"
        >
          <Icons.New className="w-4 h-4 md:w-5 md:h-5 group-hover:rotate-90 transition-transform" />
          Generate Tax Bill
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard label="Total Revenue" value={`₹${totalBilled.toLocaleString('en-IN')}`} icon={<Icons.Invoices className="w-5 h-5" />} bgColor="bg-indigo-50" iconColor="text-indigo-600" />
        <StatCard label="Active Entities" value={totalClients.toString()} icon={<Icons.Clients className="w-5 h-5" />} bgColor="bg-violet-50" iconColor="text-violet-600" />
        <StatCard label="Pending Volume" value={`₹${pendingAmount.toLocaleString('en-IN')}`} icon={<Icons.StatusPending className="w-5 h-5" />} bgColor="bg-amber-50" iconColor="text-amber-600" />
        <StatCard label="Critical Alerts" value={delayedCount.toString()} icon={<Icons.StatusOverdue className="w-5 h-5" />} bgColor="bg-rose-50" iconColor="text-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200/60 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-10">
            <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight uppercase">Operational Insights</h3>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {(['Bar', 'Line', 'Pie'] as GraphType[]).map((type) => (
                <button 
                  key={type}
                  onClick={() => setGraphType(type)}
                  className={`px-3 py-2 md:px-5 md:py-2.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${
                    graphType === type ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          
          <div className="w-full flex items-center justify-center overflow-hidden bg-slate-50/30 rounded-2xl md:rounded-3xl" style={{ minHeight: '300px' }}>
            <div className="w-full h-full">
              <ResponsiveContainer width="100%" height={300} debounce={1}>
                {renderGraph()}
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200/60 shadow-sm flex flex-col max-h-[500px] md:max-h-none">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight uppercase">Audit Log</h3>
            <Icons.ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-4 md:space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-1 md:pr-2">
            {invoices.length > 0 ? invoices.slice(0, 10).map((inv) => (
              <div key={inv.id} onClick={() => onEditInvoice(inv.id)} className="flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all border border-transparent hover:border-slate-100 group">
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white flex items-center justify-center shadow-sm text-slate-400 group-hover:text-indigo-600 shrink-0 transition-colors">
                    <Icons.Invoices className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-slate-900 text-xs md:text-sm truncate">{inv.client?.name || 'Unknown Entity'}</div>
                    <div className="text-[8px] md:text-[10px] text-slate-500 font-black tracking-widest uppercase">#{inv.invoiceNumber}</div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="font-black text-slate-900 text-xs md:text-sm">₹{(inv.total_amount || 0).toLocaleString('en-IN')}</div>
                  <div className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter ${
                    inv.status === 'Finished' ? 'bg-emerald-100 text-emerald-700' : 
                    inv.status === 'Delayed' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {inv.status}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 md:py-20 space-y-4 opacity-50">
                <Icons.Search className="w-8 h-8 md:w-10 md:h-10 text-slate-300 mx-auto" />
                <p className="text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-widest">No history found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode; bgColor: string; iconColor: string }> = ({ label, value, icon, bgColor, iconColor }) => (
  <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300">
    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-4 md:mb-6 shadow-sm ${bgColor} ${iconColor}`}>
      {icon}
    </div>
    <div className="text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</div>
    <div className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter truncate">{value}</div>
  </div>
);

export default Dashboard;
