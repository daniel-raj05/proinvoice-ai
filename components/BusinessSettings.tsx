
import React, { useState } from 'react';
import { BusinessDetails } from '../types';
import { Icons, INITIAL_BUSINESS } from '../constants';

interface BusinessSettingsProps {
  business: BusinessDetails;
  onSave: (details: BusinessDetails) => void;
}

const BusinessSettings: React.FC<BusinessSettingsProps> = ({ business, onSave }) => {
  const [formData, setFormData] = useState<BusinessDetails>(business);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = () => {
    if (confirm("Reset company logo to global default?")) {
      setFormData({ ...formData, logo: INITIAL_BUSINESS.logo });
    }
  };

  const InputField = ({ label, value, onChange, type = "text", className = "" }: any) => (
    <div className={`space-y-2 ${className} opacity-100`}>
      <label className="text-[11px] font-black uppercase tracking-widest text-slate-600 ml-1 opacity-100">{label}</label>
      <input 
        type={type} 
        className="w-full px-5 py-4 rounded-2xl border border-slate-300 bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-black shadow-sm opacity-100"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );

  return (
    <div className="max-w-4xl space-y-10 opacity-100">
      <header className="opacity-100">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight opacity-100">Business Profile</h2>
        <p className="text-slate-500 mt-1 font-medium opacity-100">Update your branding and legal information for tax invoices.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 opacity-100">
        <div className="md:col-span-1 space-y-6 opacity-100">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-300 shadow-sm flex flex-col items-center opacity-100">
            <div className="relative group mb-6 opacity-100">
              <div className="w-56 h-56 rounded-3xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden transition-all shadow-sm">
                <img src={formData.logo || INITIAL_BUSINESS.logo} alt="Logo" className="w-full h-full object-contain p-4" />
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-indigo-950/90 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-all rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-sm">
                Change Logo
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </label>
            </div>
            
            <div className="text-center space-y-4 w-full">
               <div className="opacity-100">
                  <p className="text-lg font-black text-slate-900 opacity-100">{formData.name || 'Company Name'}</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium opacity-100">Global Default Logo Active</p>
               </div>
               
               {formData.logo !== INITIAL_BUSINESS.logo && (
                 <button 
                  onClick={handleResetLogo}
                  className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors"
                 >
                   Reset to Default
                 </button>
               )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-8 opacity-100">
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-300 shadow-sm space-y-10 opacity-100">
            <section className="space-y-6 opacity-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3 opacity-100">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Icons.Business className="w-4 h-4 text-slate-600" />
                </div>
                Company Details
              </h3>
              <div className="grid grid-cols-1 gap-6 opacity-100">
                <InputField label="Registered Company Name" value={formData.name} onChange={(v:any) => setFormData({...formData, name: v})} />
                <div className="space-y-2 opacity-100">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-600 ml-1 opacity-100">Office Address</label>
                  <textarea 
                    rows={2}
                    className="w-full px-5 py-4 rounded-2xl border border-slate-300 bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-black shadow-sm resize-none opacity-100"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-6 opacity-100">
                   <InputField label="GSTIN" value={formData.gstin} onChange={(v:any) => setFormData({...formData, gstin: v})} />
                   <div className="grid grid-cols-2 gap-3 opacity-100">
                     <InputField label="State" value={formData.stateName} onChange={(v:any) => setFormData({...formData, stateName: v})} />
                     <InputField label="Code" value={formData.stateCode} onChange={(v:any) => setFormData({...formData, stateCode: v})} />
                   </div>
                </div>
              </div>
            </section>

            <section className="space-y-6 pt-10 border-t border-slate-200 opacity-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3 opacity-100">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Icons.Bank className="w-4 h-4 text-indigo-600" />
                </div>
                Banking & Declaration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-100">
                <InputField label="Bank Name & Type" className="md:col-span-2" value={formData.bankName} onChange={(v:any) => setFormData({...formData, bankName: v})} />
                <InputField label="Account Number" value={formData.accountNo} onChange={(v:any) => setFormData({...formData, accountNo: v})} />
                <InputField label="IFS Code" value={formData.ifsc} onChange={(v:any) => setFormData({...formData, ifsc: v})} />
              </div>
              <div className="space-y-2 opacity-100">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-600 ml-1 opacity-100">Default Declaration</label>
                <textarea 
                  rows={3}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-300 bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-black shadow-sm resize-none opacity-100"
                  value={formData.declaration}
                  onChange={(e) => setFormData({...formData, declaration: e.target.value})}
                />
              </div>
            </section>

            <div className="pt-10 border-t border-slate-200 flex justify-end opacity-100">
              <button 
                onClick={() => onSave(formData)}
                className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/10 transition-all hover:scale-[1.05] active:scale-95 opacity-100"
              >
                Save All Updates
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessSettings;
