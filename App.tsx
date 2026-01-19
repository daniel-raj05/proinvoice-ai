
import React, { useState, useEffect } from 'react';
import { AppState, Invoice, BusinessDetails, User, Client, InvoiceStatus } from './types';
import { Icons, INITIAL_BUSINESS } from './constants';
import { supabase, isSupabaseConfigured } from './supabase';
import Dashboard from './components/Dashboard';
import InvoiceList from './components/InvoiceList';
import InvoiceEditor from './components/InvoiceEditor';
import BusinessSettings from './components/BusinessSettings';
import LoginPage from './components/LoginPage';
import ClientList from './components/ClientList';
import ClientDetails from './components/ClientDetails';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'invoices' | 'clients' | 'client_details' | 'new' | 'edit' | 'settings'>('dashboard');
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [initialPreviewMode, setInitialPreviewMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [appState, setAppState] = useState<AppState>({
    user: null,
    invoices: [],
    clients: [],
    business: INITIAL_BUSINESS
  });

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session) {
          setAppState(prev => ({ 
            ...prev, 
            user: { 
              id: session.user.id, 
              name: session.user.user_metadata.name || 'User', 
              email: session.user.email! 
            } 
          }));
        }
      } catch (err: any) {
        console.error('Auth initialization error:', err);
        if (err.message?.includes('Failed to fetch')) {
          setConnectionError('Network Error: Unable to reach authentication server.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAppState(prev => ({ 
          ...prev, 
          user: { 
            id: session.user.id, 
            name: session.user.user_metadata.name || 'User', 
            email: session.user.email! 
            } 
        }));
      } else {
        setAppState(prev => ({ ...prev, user: null, invoices: [], clients: [] }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (appState.user) {
      fetchData();
    }
  }, [appState.user]);

  const fetchData = async () => {
    if (!isSupabaseConfigured || !appState.user) {
      return;
    }

    setIsSyncing(true);
    setConnectionError(null);
    try {
      const { data: clientsData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', appState.user.id)
        .order('created_at', { ascending: false });

      if (clientError) throw clientError;

      const processedClients = (clientsData || []).map(c => ({
        ...c.client_data,
        id: c.id,
        user_id: c.user_id,
        name: c.name,
        created_at: c.created_at
      } as Client));

      const { data: invoicesData, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          id,
          user_id,
          client_id,
          status,
          total_amount,
          created_at,
          invoice_data,
          client:clients(*)
        `)
        .eq('user_id', appState.user.id)
        .order('created_at', { ascending: false });

      if (invoiceError) throw invoiceError;

      const processedInvoices = (invoicesData || []).map(row => {
        const inv = {
          ...row.invoice_data,
          id: row.id,
          user_id: row.user_id,
          client_id: row.client_id,
          status: row.status,
          total_amount: row.total_amount,
          created_at: row.created_at
        } as Invoice;

        if (row.client) {
          const clientRow = Array.isArray(row.client) ? row.client[0] : row.client;
          if (clientRow) {
            inv.client = {
              ...clientRow.client_data,
              id: clientRow.id,
              name: clientRow.name
            };
          }
        }

        return inv;
      });

      setAppState(prev => ({ 
        ...prev, 
        clients: processedClients, 
        invoices: processedInvoices 
      }));
    } catch (err: any) {
      console.error('Data fetch error detail:', err);
      let friendlyMessage = err.message || 'An unexpected error occurred.';
      if (err.code === '42P01') friendlyMessage = 'Database Error: Required tables do not exist.';
      setConnectionError(friendlyMessage);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogin = (user: User) => {
    setAppState(prev => ({ ...prev, user }));
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      setIsLoggingOut(true);
      try { await supabase.auth.signOut(); } catch (err) { console.error('Logout error:', err); }
      setAppState(prev => ({ ...prev, user: null, invoices: [], clients: [] }));
      setEditingInvoiceId(null);
      setSelectedClient(null);
      setCurrentView('dashboard');
      setIsSidebarOpen(false);
      setIsLoggingOut(false);
    }
  };

  const handleSaveInvoice = async (invoice: Invoice) => {
    if (!confirm("Do you want to save these changes?")) return;
    
    setIsSyncing(true);
    try {
      let clientId = '';
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', appState.user?.id)
        .eq('name', invoice.client.name)
        .maybeSingle();

      const clientPayload = {
        user_id: appState.user?.id,
        name: invoice.client.name,
        client_data: invoice.client
      };

      if (existingClient) {
        clientId = existingClient.id;
        await supabase.from('clients').update(clientPayload).eq('id', clientId);
      } else {
        const { data: newClient, error: cErr } = await supabase.from('clients')
          .insert(clientPayload)
          .select().single();
        if (cErr) throw cErr;
        clientId = newClient.id;
      }

      const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
      const total = subtotal * (1 + (invoice.taxRate || 0) / 100) - (invoice.discount || 0);

      const invoiceRow = {
        user_id: appState.user?.id,
        client_id: clientId,
        status: invoice.status || 'Pending',
        total_amount: total,
        invoice_data: invoice
      };

      if (editingInvoiceId) {
        const { error: iErr } = await supabase
          .from('invoices')
          .update(invoiceRow)
          .eq('id', editingInvoiceId);
        if (iErr) throw iErr;
      } else {
        const { error: iErr } = await supabase
          .from('invoices')
          .insert(invoiceRow);
        if (iErr) throw iErr;
      }

      await fetchData();
      setInitialPreviewMode(false);
      setCurrentView('invoices');
    } catch (err: any) {
      console.error('Save error:', err);
      alert(`Failed to save invoice: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateInvoiceStatus = async (id: string, status: InvoiceStatus) => {
    try {
      const { error } = await supabase.from('invoices').update({ status }).eq('id', id);
      if (error) throw error;
      setAppState(prev => ({
        ...prev,
        invoices: prev.invoices.map(inv => inv.id === id ? { ...inv, status } : inv)
      }));
    } catch (err: any) {
      console.error('Status update error:', err);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm("Are you sure you want to delete this? This action cannot be undone.")) return;
    
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchData();
      setCurrentView('dashboard');
      setTimeout(() => {
        setCurrentView('invoices');
      }, 0);

    } catch (err: any) {
      console.error('Delete error:', err);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm("Are you sure you want to delete this? This action cannot be undone.")) return;
    
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchData();
      setCurrentView('dashboard');
      setTimeout(() => {
        setCurrentView('clients');
      }, 0);

    } catch (err: any) {
      console.error('Delete error:', err);
    }
  };

  const handleDownloadInvoice = (id: string) => {
    setEditingInvoiceId(id);
    setSelectedClient(null);
    setInitialPreviewMode(true);
    setCurrentView('edit');
  };

  const handleUpdateBusiness = (business: BusinessDetails) => {
    if (!confirm("Do you want to save these changes?")) return;
    
    setAppState(prev => ({ ...prev, business }));
    alert('Business profile updated successfully!');
    setCurrentView('dashboard');
  };

  const NavItem = ({ view, icon: Icon, label }: { view: any, icon: any, label: string }) => (
    <button 
      onClick={() => {
        setEditingInvoiceId(null);
        setSelectedClient(null);
        setInitialPreviewMode(false);
        setCurrentView(view);
        setIsSidebarOpen(false);
      }}
      className={`flex md:w-full items-center gap-3 px-4 py-3.5 md:py-3 rounded-xl transition-all duration-300 group shrink-0 ${
        currentView === view 
          ? 'bg-indigo-600 text-white shadow-lg md:shadow-indigo-600/30' 
          : 'text-slate-400 md:text-white hover:bg-slate-800'
      }`}
    >
      <Icon className={`w-5 h-5 transition-transform duration-300 ${currentView === view ? 'scale-110' : 'group-hover:scale-110'}`} />
      <span className={`text-sm tracking-wide whitespace-nowrap ${currentView === view ? 'font-semibold' : 'font-medium'}`}>{label}</span>
    </button>
  );

  if (isLoading || isLoggingOut) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center animate-pulse shadow-2xl shadow-indigo-500/50">
          <Icons.Invoices className="w-8 h-8 text-white" />
        </div>
        <div className="text-center space-y-2 px-6">
          <h2 className="text-white text-xl font-black uppercase tracking-widest">JKI BILLING SOFTWARE</h2>
          <p className="text-slate-500 font-bold text-sm">Initializing Secure Session...</p>
        </div>
      </div>
    );
  }

  if (connectionError && !appState.user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-rose-50 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto text-rose-600">
            <Icons.StatusOverdue className="w-8 h-8 md:w-10 md:h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Connectivity Alert</h2>
            <p className="text-slate-500 font-medium text-sm">{connectionError}</p>
          </div>
          <button 
            onClick={() => fetchData()}
            className="w-full bg-slate-900 text-white py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all active:scale-95"
          >
            Attempt Reconnection
          </button>
        </div>
      </div>
    );
  }

  if (!appState.user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-slate-950 text-white sticky top-0 z-40 no-print border-b border-slate-900">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
            <Icons.Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2" onClick={() => setCurrentView('dashboard')}>
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center overflow-hidden">
               {appState.business.logo ? <img src={appState.business.logo} alt="Logo" className="w-full h-full object-cover" /> : <Icons.Business className="w-5 h-5 text-indigo-600" />}
            </div>
            <span className="font-black text-sm tracking-tighter uppercase">JKI BILLING</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isSyncing && <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>}
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-white transition-colors">
            <Icons.Lock className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Sidebar Drawer Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 md:hidden animate-in fade-in duration-300" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Sidebar / Drawer Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-slate-950 text-white flex flex-col no-print border-r border-slate-900 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => { setCurrentView('dashboard'); setIsSidebarOpen(false); }}>
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform overflow-hidden">
              {appState.business.logo ? (
                <img src={appState.business.logo} alt="JKI Logo" className="w-full h-full object-cover" />
              ) : (
                <Icons.Business className="w-6 h-6 text-indigo-600" />
              )}
            </div>
            <h1 className="text-xl font-black text-white tracking-tighter uppercase leading-tight">JKI <br/>BILLING</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-white transition-colors">
            <Icons.X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 pt-4 overflow-y-auto custom-scrollbar">
          <div className="px-4 mb-4 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">Main Menu</span>
            {isSyncing && <div className="hidden md:flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div></div>}
          </div>
          <NavItem view="dashboard" icon={Icons.Dashboard} label="Dashboard" />
          <NavItem view="clients" icon={Icons.Clients} label="Clients" />
          <NavItem view="invoices" icon={Icons.Invoices} label="Invoices" />
          <NavItem view="new" icon={Icons.New} label="Create New" />
          <div className="px-4 mt-10 mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">Configuration</div>
          <NavItem view="settings" icon={Icons.Settings} label="Settings" />
        </nav>

        <div className="p-4 border-t border-slate-900 space-y-4">
          <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-700 bg-slate-800 shrink-0">
                {appState.user.avatar ? <img src={appState.user.avatar} alt="Avatar" /> : <Icons.Business className="w-full h-full p-2 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white truncate">{appState.user.name}</p>
                <p className="text-[10px] text-slate-300 font-bold truncate">{appState.user.email}</p>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full group flex items-center justify-center gap-3 px-4 py-4 text-white hover:bg-rose-600 rounded-2xl transition-all text-[10px] font-black uppercase tracking-[0.2em]">
            Terminate Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto scroll-smooth relative custom-scrollbar">
        {connectionError && (
          <div className="bg-rose-600 text-white text-[11px] font-black uppercase tracking-widest py-3 px-4 md:px-10 flex items-center justify-between sticky top-0 md:top-0 z-50">
            <div className="flex items-center gap-3">
              <Icons.StatusOverdue className="w-4 h-4" />
              <span className="truncate">Warning: {connectionError}</span>
            </div>
            <button onClick={() => fetchData()} className="bg-white/20 hover:bg-white/30 px-4 py-1 rounded-lg shrink-0">Retry</button>
          </div>
        )}
        <div className="max-w-7xl mx-auto p-4 md:p-10">
          {currentView === 'dashboard' && <Dashboard invoices={appState.invoices} onNewInvoice={() => { setEditingInvoiceId(null); setSelectedClient(null); setCurrentView('new'); }} onEditInvoice={(id) => { setEditingInvoiceId(id); setSelectedClient(null); setCurrentView('edit'); }} />}
          {currentView === 'invoices' && <InvoiceList invoices={appState.invoices} onEdit={(id) => { setEditingInvoiceId(id); setSelectedClient(null); setInitialPreviewMode(false); setCurrentView('edit'); }} onDelete={handleDeleteInvoice} onDownload={handleDownloadInvoice} />}
          {currentView === 'clients' && <ClientList clients={appState.clients} invoices={appState.invoices} onViewClient={(client) => { setSelectedClient(client); setCurrentView('client_details'); }} onDeleteClient={handleDeleteClient} />}
          {currentView === 'client_details' && selectedClient && (
            <ClientDetails
              key={`${selectedClient.id}-${appState.invoices.length}`}
              client={selectedClient}
              invoices={appState.invoices.filter(i => i.client_id === selectedClient.id)}
              onBack={() => setCurrentView('clients')}
              onEditInvoice={(id) => {
                setEditingInvoiceId(id);
                setSelectedClient(null);
                setInitialPreviewMode(false);
                setCurrentView('edit');
              }}
              onDeleteInvoice={handleDeleteInvoice}
              onDownloadInvoice={handleDownloadInvoice}
              onCreateInvoice={(client) => {
                setSelectedClient(client);
                setCurrentView('new');
              }}
              onUpdateStatus={handleUpdateInvoiceStatus}
            />
          )}

          {(currentView === 'new' || currentView === 'edit') && <InvoiceEditor invoice={editingInvoiceId ? appState.invoices.find(i => i.id === editingInvoiceId) : null} prefilledClient={selectedClient} business={appState.business} onSave={handleSaveInvoice} onCancel={() => { if (selectedClient && !editingInvoiceId) setCurrentView('client_details'); else setCurrentView('invoices'); }} initialPreview={initialPreviewMode} />}
          {currentView === 'settings' && <BusinessSettings business={appState.business} onSave={handleUpdateBusiness} />}
        </div>
      </main>
    </div>
  );
};

export default App;
