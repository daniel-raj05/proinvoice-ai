import React, { useState, useMemo } from 'react';
import { Invoice, InvoiceItem, BusinessDetails, Client, InvoiceStatus } from '../types';
import { Icons, INITIAL_BUSINESS } from '../constants';
import { extractInvoiceData } from '../geminiService';

interface InvoiceEditorProps {
  invoice: Invoice | null;
  prefilledClient?: Client | null;
  business: BusinessDetails;
  onSave: (invoice: Invoice) => void;
  onCancel: () => void;
  initialPreview?: boolean;
}

const InvoiceEditor: React.FC<InvoiceEditorProps> = ({ invoice, prefilledClient, business, onSave, onCancel, initialPreview = false }) => {
  const [formData, setFormData] = useState<Invoice>(() => {
    const defaultClient: Client = { 
      name: '', 
      email: '', 
      address: '', 
      phone: '', 
      gstin: '', 
      stateName: '', 
      stateCode: '' 
    };

    if (invoice) {
      return { 
        ...invoice,
        client: { ...defaultClient, ...(invoice.client || {}) },
        consignee: { ...defaultClient, ...(invoice.consignee || invoice.client || {}) }
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const clientData = prefilledClient 
      ? { ...defaultClient, ...prefilledClient } 
      : { ...defaultClient };
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      invoiceNumber: '',
      date: today,
      dueDate: today,
      client: clientData,
      consignee: { ...clientData }, 
      items: [{ id: '1', description: '', hsn: '', quantity: 0, unit: 'NOS', unitPrice: 0, total: 0 }],
      notes: '',
      taxRate: 18,
      discount: 0,
      status: 'Pending',
      currency: 'INR',
      deliveryNote: '',
      paymentTerms: '',
      buyersOrderNo: '',
      orderDate: '',
      dispatchDocNo: '',
      deliveryNoteDate: '',
      dispatchedThrough: '',
      destination: '',
      lrNo: '',
      vehicleNo: '',
      termsOfDelivery: INITIAL_BUSINESS.defaultTerms,
      declaration: business.declaration || INITIAL_BUSINESS.declaration,
      supplierStateName: business.stateName,
      supplierStateCode: business.stateCode
    };
  });

  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(initialPreview);
  const [printCopyType, setPrintCopyType] = useState<'ALL' | 'ORIGINAL' | 'DUPLICATE' | 'TRIPLICATE'>('ALL');
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now().toString(), description: '', hsn: '', quantity: 0, unit: 'NOS', unitPrice: 0, total: 0 }]
    }));
  };

  const handleRemoveItem = (id: string) => {
    if (formData.items.length === 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== id)
    }));
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            const q = typeof updated.quantity === 'number' ? updated.quantity : 0;
            const p = typeof updated.unitPrice === 'number' ? updated.unitPrice : 0;
            updated.total = q * p;
          }
          return updated;
        }
        return item;
      })
    }));
  };

  const handleAiExtract = async () => {
    if (!aiInput.trim()) return;
    setIsAiLoading(true);
    try {
      const result = await extractInvoiceData(aiInput);
      if (result.items && result.items.length > 0) {
        const newItems: InvoiceItem[] = result.items.map((item, idx) => ({
          id: `ai-${idx}-${Date.now()}`,
          description: item.description || 'Unspecified item',
          hsn: '',
          quantity: item.quantity || 0,
          unit: 'NOS',
          unitPrice: item.unitPrice || 0,
          total: (item.quantity || 0) * (item.unitPrice || 0)
        }));
        
        setFormData(prev => ({
          ...prev,
          items: newItems,
          client: { ...prev.client, name: result.clientName || prev.client.name }
        }));
        setAiInput('');
      }
    } catch (err) {
      alert('AI processing failed.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDownloadHtml = () => {
    const element = document.querySelector('.invoice-preview-all-container');
    if (element) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Invoice ${formData.invoiceNumber || 'Draft'}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
            <style>
              body { background: #f8fafc; padding: 40px; font-family: 'Inter', sans-serif; }
              @media print { .no-print { display: none; } }
              .invoice-preview-container { margin: 0 auto 40px auto; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); background: white; }
            </style>
          </head>
          <body>
            <div class="max-w-[210mm] mx-auto">
               ${element.innerHTML}
            </div>
          </body>
        </html>
      `;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${formData.invoiceNumber || 'Draft'}_${printCopyType}.html`;
      link.click();
      URL.revokeObjectURL(url);
    }
    setShowDownloadOptions(false);
  };

  const handleDownloadPdf = () => {
    const element = document.querySelector('.invoice-preview-all-container');
    if (element) {
      const opt = {
        margin: 0,
        filename: `Invoice_${formData.invoiceNumber || 'Draft'}_${printCopyType}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      // @ts-ignore
      html2pdf().from(element).set(opt).save();
    }
    setShowDownloadOptions(false);
  };

  const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
  const totalTaxRate = formData.taxRate || 0;
  const cgstAmount = subtotal * (totalTaxRate / 200);
  const sgstAmount = subtotal * (totalTaxRate / 200);
  const totalTax = cgstAmount + sgstAmount;
  const totalAmount = subtotal + totalTax - formData.discount;

  const hsnSummary = useMemo(() => {
    const map = new Map<string, { taxableValue: number; cgst: number; sgst: number; rate: number }>();
    formData.items.forEach(item => {
      const hsn = item.hsn || '---';
      const current = map.get(hsn) || { taxableValue: 0, cgst: 0, sgst: 0, rate: formData.taxRate };
      current.taxableValue += item.total;
      current.cgst += item.total * (formData.taxRate / 200);
      current.sgst += item.total * (formData.taxRate / 200);
      map.set(hsn, current);
    });
    return Array.from(map.entries());
  }, [formData.items, formData.taxRate]);

  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    function helper(n: number): string {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + helper(n % 100) : '');
      if (n < 100000) return helper(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + helper(n % 1000) : '');
      if (n < 10000000) return helper(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + helper(n % 100000) : '');
      return helper(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + helper(n % 10000000) : '');
    }

    const split = Math.abs(num).toFixed(2).split('.');
    const rupees = parseInt(split[0]);
    const paise = parseInt(split[1]);
    
    let res = (rupees === 0 ? 'Zero' : helper(rupees)) + ' Rupees';
    if (paise > 0) {
      res += ' and ' + helper(paise) + ' Paise';
    }
    return 'INR ' + res + ' Only';
  };

  const formatDate = (d?: string) => {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-').toUpperCase();
  };

  const PreviewInfoCell = ({ label, value, borderRight, borderBottom }: { label: string, value?: string, borderRight?: boolean, borderBottom?: boolean }) => (
    <div className={`p-1.5 min-h-[34px] flex flex-col justify-start bg-white ${borderRight ? 'border-r border-black' : ''} ${borderBottom ? 'border-b border-black' : ''}`}>
      <div className="text-[7px] font-bold text-black uppercase leading-none mb-1">{label}</div>
      <div className="text-[9px] font-bold text-black leading-tight uppercase whitespace-pre-wrap break-words">{value || ' '}</div>
    </div>
  );

  const InvoicePage = ({ title }: { title: string }) => (
    <div className="invoice-preview-container bg-white text-black p-[10mm] font-sans w-[210mm] min-h-[297mm] max-width-[210mm] print:border-none print:m-0 overflow-hidden text-[10px] leading-tight flex flex-col page-break mb-10 print:mb-0 shadow-2xl print:shadow-none box-border">
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          .page-break { break-after: page; }
          .invoice-preview-container { 
            width: 210mm; 
            height: 297mm; 
            min-height: 297mm; 
            padding: 10mm; 
            margin: 0; 
            box-shadow: none; 
            border: none;
            overflow: hidden;
            box-sizing: border-box;
          }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
        }
        .invoice-preview-container table, .invoice-preview-container th, .invoice-preview-container td { border: 1px solid black !important; }
        .invoice-preview-container table { border-collapse: collapse !important; width: 100% !important; table-layout: fixed !important; }
        .invoice-preview-container th { background-color: #f2f2f2 !important; color: #000 !important; font-weight: 700 !important; }
        .invoice-box { border: 1px solid black; width: 100%; box-sizing: border-box; }
        .goods-table { border: 1px solid black !important; border-collapse: collapse !important; }
        .goods-table th, .goods-table td { border-left: 1px solid black !important; border-right: 1px solid black !important; border-top: 0 !important; border-bottom: 0 !important; }
        .goods-table tr.header-row th { border-top: 1px solid black !important; border-bottom: 1.5px solid black !important; background-color: #f2f2f2 !important; }
        .goods-table tr.item-row td { padding: 4px 8px; vertical-align: top; }
        .goods-table tr.total-row td { 
          border-top: 1.5px solid black !important; 
          border-bottom: 1.5px solid black !important; 
          padding: 8px 8px !important; 
          font-weight: 900 !important; 
          background-color: #f1f5f9 !important; 
          color: #000000 !important; 
        }
        .footer-note { margin-top: 8px; font-size: 8px; font-weight: 700; text-align: center; opacity: 0.8; width: 100%; }
      `}</style>
      
      <div className="invoice-box flex flex-col border border-black">
        <div className="flex items-center justify-center border-b border-black py-1 h-8 bg-gray-100">
          <div className="font-bold text-[11px] uppercase tracking-wider text-black">Tax Invoice ({title})</div>
        </div>

        <div className="grid grid-cols-2 border-b border-black">
          <div className="border-r border-black flex flex-col">
            <div className="flex p-3 border-b border-black min-h-[90px]">
              <div className="w-[70px] h-[70px] border border-black flex-shrink-0 flex items-center justify-center bg-white mr-3 overflow-hidden">
                {business.logo ? <img src={business.logo} alt="Logo" className="max-w-full max-h-full object-contain" /> : <div className="text-indigo-600 font-black text-xs">JKI</div>}
              </div>
              <div className="flex-1">
                <div className="font-bold uppercase text-[12px] mb-1 text-black">{business.name}</div>
                <div className="text-[9.5px] leading-tight whitespace-pre-wrap mb-2 text-black">{business.address}</div>
                <div className="text-[9.5px] font-bold text-black">
                  GSTIN/UIN: <span className="text-black font-black">{business.gstin}</span><br/>
                  State Name : <span className="text-black font-black">{formData.supplierStateName || business.stateName}</span>, Code : <span className="text-black font-black">{formData.supplierStateCode || business.stateCode}</span><br/>
                  Contact : <span className="text-black font-black">{business.phone}</span>
                </div>
              </div>
            </div>
            <div className="p-2.5 border-b border-black min-h-[65px]">
              <div className="text-[8px] font-bold text-black uppercase mb-1">Consignee (Ship to)</div>
              <div className="font-bold uppercase text-[9.5px] mb-1 text-black">{formData.consignee?.name || '---'}</div>
              <div className="text-[9.5px] text-black whitespace-pre-wrap font-medium leading-tight">{formData.consignee?.address || '---'}</div>
              <div className="mt-1.5 text-[9.5px] font-bold text-black">
                GSTIN/UIN : <span className="text-black font-black">{formData.consignee?.gstin || '---'}</span><br/>
                State Name : <span className="text-black font-black">{formData.consignee?.stateName || '---'}</span>, Code : <span className="text-black font-black">{formData.consignee?.stateCode || '---'}</span>
              </div>
            </div>
            <div className="p-2.5 min-h-[65px]">
              <div className="text-[8px] font-bold text-black uppercase mb-1">Buyer (Bill to)</div>
              <div className="font-bold uppercase text-[9.5px] mb-1 text-black">{formData.client.name || '---'}</div>
              <div className="text-[9.5px] text-black whitespace-pre-wrap font-medium leading-tight">{formData.client.address || '---'}</div>
              <div className="mt-1.5 text-[9.5px] font-bold text-black">
                GSTIN/UIN : <span className="text-black font-black">{formData.client.gstin || '---'}</span><br/>
                State Name : <span className="text-black font-black">{formData.client.stateName || '---'}</span>, Code : <span className="text-black font-black">{formData.client.stateCode || '---'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 auto-rows-min">
            <PreviewInfoCell label="Invoice No." value={formData.invoiceNumber} borderRight borderBottom />
            <PreviewInfoCell label="Dated" value={formatDate(formData.date)} borderBottom />
            <PreviewInfoCell label="Delivery Note" value={formData.deliveryNote} borderRight borderBottom />
            <PreviewInfoCell label="Mode/Terms of Payment" value={formData.paymentTerms} borderBottom />
            <PreviewInfoCell label="Buyer's Order No." value={formData.buyersOrderNo} borderRight borderBottom />
            <PreviewInfoCell label="Dated" value={formatDate(formData.orderDate)} borderBottom />
            <PreviewInfoCell label="Dispatch Doc No." value={formData.dispatchDocNo} borderRight borderBottom />
            <PreviewInfoCell label="Delivery Note Date" value={formatDate(formData.deliveryNoteDate)} borderBottom />
            <PreviewInfoCell label="Dispatched through" value={formData.dispatchedThrough} borderRight borderBottom />
            <PreviewInfoCell label="Destination" value={formData.destination} borderBottom />
            <PreviewInfoCell label="Bill of Lading/LR-RR No." value={formData.lrNo} borderRight borderBottom />
            <PreviewInfoCell label="Motor Vehicle No." value={formData.vehicleNo} borderBottom />
            <div className="col-span-2 p-2 min-h-[60px] border-none bg-white">
              <div className="text-[7.5px] font-bold text-black uppercase mb-1">Terms of Delivery</div>
              <div className="text-[9.5px] text-black whitespace-pre-wrap leading-tight font-bold">{formData.termsOfDelivery}</div>
            </div>
          </div>
        </div>

        <div className="border-b border-black">
          <table className="w-full goods-table">
            <thead>
              <tr className="h-10 text-[8px] uppercase text-center font-bold header-row">
                <th style={{width: '5%'}}>Sl No.</th>
                <th style={{width: '40%', textAlign: 'left', paddingLeft: '12px'}}>Description of Goods</th>
                <th style={{width: '10%'}}>HSN/SAC</th>
                <th style={{width: '10%'}}>Quantity</th>
                <th style={{width: '10%'}}>Rate</th>
                <th style={{width: '8%'}}>per</th>
                <th style={{width: '17%'}}>Amount</th>
              </tr>
            </thead>
            <tbody className="text-[10px] font-bold text-black">
              {formData.items.map((item, idx) => {
                const itemTaxableVal = item.total;
                const itemCgst = itemTaxableVal * (totalTaxRate / 200);
                const itemSgst = itemTaxableVal * (totalTaxRate / 200);
                return (
                  <tr key={item.id} className="item-row">
                    <td className="text-center">{idx + 1}</td>
                    <td>
                      <div className="uppercase mb-1">{item.description}</div>
                      <div className="flex justify-end pr-4 text-[9px]">
                        <div className="flex flex-col items-end italic text-black font-black">
                          <span>CGST</span>
                          <span>SGST</span>
                        </div>
                      </div>
                    </td>
                    <td className="text-center">{item.hsn || '---'}</td>
                    <td className="text-center whitespace-nowrap">{item.quantity} {item.unit}</td>
                    <td className="text-right">{item.unitPrice.toFixed(2)}</td>
                    <td className="text-center">{item.unit}</td>
                    <td className="text-right">
                      <div className="mb-1">{itemTaxableVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      <div className="flex flex-col items-end text-[9px] italic font-black text-black">
                        <span>{itemCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        <span>{itemSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
               <tr className="total-row h-10">
                 <td colSpan={3} className="text-right pr-4 font-black text-black text-[11px] uppercase tracking-widest">Total</td>
                 <td className="text-center font-black text-black text-[11px]">{formData.items.reduce((s, i) => s + i.quantity, 0)} {formData.items[0]?.unit || 'NOS'}</td>
                 <td></td>
                 <td></td>
                 <td className="text-right pr-2 font-black text-black text-[11px]">₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
               </tr>
            </tfoot>
          </table>
        </div>

        <div className="border-b border-black p-2 bg-white">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="text-[7.5px] font-bold text-black uppercase mb-1">Amount Chargeable (in words)</div>
              <div className="font-bold text-[10px] uppercase tracking-tight text-black">{numberToWords(totalAmount)}</div>
            </div>
            <div className="text-[9px] font-bold italic pr-2">E. & O.E</div>
          </div>
        </div>

        <div className="border-b border-black bg-white">
          <table className="w-full text-center text-[9px]">
            <thead>
              <tr className="font-bold uppercase h-7">
                <th rowSpan={2} style={{width: '15%'}}>HSN/SAC</th>
                <th rowSpan={2} style={{width: '15%'}}>Taxable Value</th>
                <th colSpan={2}>CGST</th>
                <th colSpan={2}>SGST/UTGST</th>
                <th rowSpan={2} style={{width: '20%'}}>Total Tax Amount</th>
              </tr>
              <tr className="font-bold uppercase h-6"><th>Rate</th><th>Amount</th><th>Rate</th><th>Amount</th></tr>
            </thead>
            <tbody className="font-bold text-black">
              {hsnSummary.map(([hsn, data]) => (
                <tr key={hsn} className="h-6">
                  <td className="uppercase">{hsn}</td>
                  <td>{data.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td>{data.rate/2}%</td>
                  <td>{data.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td>{data.rate/2}%</td>
                  <td>{data.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td>{(data.cgst + data.sgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="h-6 font-black uppercase">
                <td className="text-right pr-2">Total</td>
                <td>{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td></td>
                <td>{cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td></td>
                <td>{sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td>{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="border-b border-black p-2 bg-white">
          <div className="text-[7.5px] font-bold text-black uppercase mb-1">Tax Amount (in words) :</div>
          <div className="font-bold text-[10px] uppercase tracking-tight text-black">{numberToWords(totalTax)}</div>
        </div>

        <div className="grid grid-cols-2 border-b border-black">
          <div className="border-r border-black p-3 flex flex-col justify-start min-h-[60px]">
            <div className="font-bold underline uppercase text-[8px] mb-2 tracking-widest text-black">Declaration</div>
            <div className="italic font-bold text-[9.5px] text-black leading-snug whitespace-pre-wrap">{formData.declaration}</div>
          </div>
          <div className="p-3 flex flex-col justify-start relative min-h-[60px]">
            <div className="font-bold underline uppercase text-[8px] mb-2 text-black">Company's Bank Details</div>
            <div className="space-y-1 font-bold text-[10px] text-black">
              <div className="flex"><span className="w-24 text-black uppercase text-[7.5px] font-bold">A/c Holder's Name:</span><span className="uppercase flex-1">{business.name}</span></div>
              <div className="flex"><span className="w-24 text-black uppercase text-[7.5px] font-bold">Bank Name:</span><span className="uppercase flex-1">{business.bankName}</span></div>
              <div className="flex"><span className="w-24 text-black uppercase text-[7.5px] font-bold">A/c No.:</span><span className="uppercase flex-1 tracking-widest text-[10px] font-black">{business.accountNo}</span></div>
              <div className="flex"><span className="w-24 text-black uppercase text-[7.5px] font-bold">Branch & IFS Code:</span><span className="uppercase flex-1 font-black">{business.branch} & {business.ifsc}</span></div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-end px-6 py-3 bg-white min-h-[45px]">
          <div className="text-center"><div className="w-44 h-[1px] bg-black mb-1"></div><div className="text-[9px] font-bold uppercase text-black">Customer's Seal and Signature</div></div>
          <div className="text-center"><div className="font-black uppercase text-[10px] mb-4 tracking-tight text-black">for {business.name}</div><div className="w-44 h-[1px] bg-black mb-1 mx-auto"></div><div className="font-bold uppercase text-[9px] text-black">Authorised Signatory</div></div>
        </div>
        
        {/* Professional placement of generated note inside the main container to avoid orphans */}
        <div className="border-t border-black py-1.5 text-center bg-gray-50/50">
          <div className="text-[7.5px] font-bold uppercase tracking-widest text-black opacity-60">This is a Computer Generated Invoice</div>
        </div>
      </div>
    </div>
  );

  if (isPreview) {
    return (
      <div className="bg-slate-100 min-h-screen py-6 md:py-10 print:py-0 print:bg-white flex flex-col items-center">
        <div className="flex flex-col items-center justify-between mb-8 no-print w-full max-w-[210mm] px-4 gap-6">
          <button onClick={() => setIsPreview(false)} className="bg-white border border-slate-300 text-slate-700 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-slate-50 transition-all shadow-md self-start">
            <Icons.ChevronRight className="rotate-180 w-4 h-4" /> Go Back
          </button>
          
          <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-3xl shadow-xl border border-slate-200 w-full relative">
            <div className="flex flex-col gap-1 w-full md:w-auto">
              <span className="text-[10px] font-black uppercase text-slate-400 ml-2">1. Choose Copy</span>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
                {['ALL', 'ORIGINAL', 'DUPLICATE', 'TRIPLICATE'].map(type => (
                  <button 
                    key={type}
                    onClick={() => setPrintCopyType(type as any)}
                    className={`px-3 md:px-4 py-2 rounded-lg text-[9px] md:text-[10px] font-black uppercase transition-all whitespace-nowrap ${printCopyType === type ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="hidden md:block h-10 w-[1px] bg-slate-200 mx-2"></div>

            <div className="flex flex-col gap-1 w-full md:w-auto">
              <span className="text-[10px] font-black uppercase text-slate-400 ml-2">2. Action</span>
              <div className="flex gap-2 w-full">
                <button onClick={() => window.print()} className="flex-1 md:flex-none bg-slate-900 text-white px-4 md:px-6 py-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-black transition-all">
                  <Icons.Print className="w-4 h-4" /> Print
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setShowDownloadOptions(!showDownloadOptions)} 
                    className="flex-1 md:flex-none bg-emerald-600 text-white px-4 md:px-6 py-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all"
                  >
                    <Icons.Download className="w-4 h-4" /> Download
                  </button>
                  {showDownloadOptions && (
                    <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 w-40 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      <button onClick={handleDownloadPdf} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors border-b border-slate-100 flex items-center gap-2 text-emerald-600">
                        PDF Document
                      </button>
                      <button onClick={handleDownloadHtml} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors flex items-center gap-2 text-indigo-600">
                        HTML Web Page
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button onClick={() => onSave(formData)} className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-700 transition-all shadow-lg active:scale-95 md:ml-2">Save Record</button>
          </div>
        </div>
        
        <div className="w-full relative flex-1 no-print">
          <div className="md:hidden absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900/10 to-transparent pointer-events-none z-10"></div>
          
          <div className="w-full overflow-x-auto custom-scrollbar no-print">
            <div className="w-fit mx-auto px-4 md:px-0 py-4 invoice-preview-all-container flex flex-col gap-12 print:gap-0">
              <div className="min-w-[210mm]">
                {(printCopyType === 'ALL' || printCopyType === 'ORIGINAL') && <InvoicePage title="ORIGINAL FOR RECIPIENT" />}
                {(printCopyType === 'ALL' || printCopyType === 'DUPLICATE') && <InvoicePage title="DUPLICATE FOR TRANSPORTER" />}
                {(printCopyType === 'ALL' || printCopyType === 'TRIPLICATE') && <InvoicePage title="TRIPLICATE FOR SUPPLIER" />}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Designer</h2>
          <p className="text-slate-500 mt-1 font-medium text-sm md:text-base">Standardized JKI Industries GST Interface.</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="flex-1 md:flex-none px-4 md:px-6 py-3 text-slate-600 font-bold hover:text-slate-900">Cancel</button>
          <button onClick={() => setIsPreview(true)} className="flex-1 md:flex-none bg-indigo-600 text-white px-6 md:px-10 py-4 rounded-xl md:rounded-2xl font-bold shadow-xl md:shadow-2xl shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-3">
            <Icons.Print className="w-4 h-4 md:w-5 md:h-5" /> Preview
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-slate-300 shadow-xl space-y-8 md:space-y-12">
            <section className="space-y-6">
              <SectionHeader icon={Icons.Invoices} title="Metadata" color="text-indigo-600" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <InputGroup 
                  label="Invoice #" 
                  value={formData.invoiceNumber} 
                  onChange={(v) => setFormData(prev => ({ ...prev, invoiceNumber: v }))} 
                />
                <InputGroup 
                  label="Date" 
                  value={formData.date} 
                  type="date" 
                  onChange={(v) => setFormData(prev => ({ ...prev, date: v }))} 
                />
                <InputGroup 
                  label="Due" 
                  value={formData.dueDate} 
                  type="date" 
                  onChange={(v) => setFormData(prev => ({ ...prev, dueDate: v }))} 
                />
                <InputGroup 
                  label="GST %" 
                  value={formData.taxRate.toString()} 
                  type="number" 
                  onChange={(v) => setFormData(prev => ({ ...prev, taxRate: parseInt(v) || 0 }))} 
                />
              </div>
            </section>

            <section className="space-y-6">
              <SectionHeader icon={Icons.Logistics} title="Logistics" color="text-violet-600" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <InputGroup label="Delivery Note" value={formData.deliveryNote || ''} onChange={(v) => setFormData(prev => ({...prev, deliveryNote: v}))} />
                <InputGroup label="Payment Mode" value={formData.paymentTerms || ''} onChange={(v) => setFormData(prev => ({...prev, paymentTerms: v}))} />
                <InputGroup label="Buyer Order #" value={formData.buyersOrderNo || ''} onChange={(v) => setFormData(prev => ({...prev, buyersOrderNo: v}))} />
                <InputGroup label="Order Date" type="date" value={formData.orderDate || ''} onChange={(v) => setFormData(prev => ({...prev, orderDate: v}))} />
                <InputGroup label="Dispatch Doc #" value={formData.dispatchDocNo || ''} onChange={(v) => setFormData(prev => ({...prev, dispatchDocNo: v}))} />
                <InputGroup label="Deliv. Date" type="date" value={formData.deliveryNoteDate || ''} onChange={(v) => setFormData(prev => ({...prev, deliveryNoteDate: v}))} />
                <InputGroup label="Through" value={formData.dispatchedThrough || ''} onChange={(v) => setFormData(prev => ({...prev, dispatchedThrough: v}))} />
                <InputGroup label="Destination" value={formData.destination || ''} onChange={(v) => setFormData(prev => ({...prev, destination: v}))} />
                <InputGroup label="LR-RR #" value={formData.lrNo || ''} onChange={(v) => setFormData(prev => ({...prev, lrNo: v}))} />
                <InputGroup label="Vehicle #" value={formData.vehicleNo || ''} onChange={(v) => setFormData(prev => ({...prev, vehicleNo: v}))} />
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Delivery Terms</label>
                  <textarea rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-medium text-black" value={formData.termsOfDelivery} onChange={(e) => setFormData(prev => ({...prev, termsOfDelivery: e.target.value}))} />
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <SectionHeader icon={Icons.Business} title="Buyer" color="text-emerald-600" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <InputGroup 
                  label="Name" 
                  value={formData.client.name} 
                  onChange={(v) => setFormData(prev => ({ ...prev, client: { ...prev.client, name: v } }))} 
                />
                <InputGroup 
                  label="GSTIN" 
                  value={formData.client.gstin || ''} 
                  onChange={(v) => setFormData(prev => ({ ...prev, client: { ...prev.client, gstin: v } }))} 
                />
                <InputGroup 
                  label="State Name" 
                  value={formData.client.stateName || ''} 
                  onChange={(v) => setFormData(prev => ({ ...prev, client: { ...prev.client, stateName: v } }))} 
                />
                <InputGroup 
                  label="State Code" 
                  value={formData.client.stateCode || ''} 
                  onChange={(v) => setFormData(prev => ({ ...prev, client: { ...prev.client, stateCode: v } }))} 
                />
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Address</label>
                  <textarea 
                    rows={2} 
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-medium text-black" 
                    value={formData.client.address} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, client: { ...prev.client, address: val } }));
                    }} 
                  />
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <SectionHeader icon={Icons.Logistics} title="Consignee (Ship To)" color="text-indigo-600" />

              <div className="flex items-center gap-2 mb-2">
                <button 
                  onClick={() => setFormData(prev => ({ ...prev, consignee: { ...prev.client } }))}
                  className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors shadow-sm"
                >
                  Copy from Buyer
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputGroup
                  label="Consignee Name"
                  value={formData.consignee?.name || ''}
                  onChange={(v) =>
                    setFormData(prev => ({
                      ...prev,
                      consignee: { ...(prev.consignee || {}), name: v } as Client
                    }))
                  }
                />

                <InputGroup
                  label="GSTIN"
                  value={formData.consignee?.gstin || ''}
                  onChange={(v) =>
                    setFormData(prev => ({
                      ...prev,
                      consignee: { ...(prev.consignee || {}), gstin: v } as Client
                    }))
                  }
                />

                <InputGroup
                  label="State Name"
                  value={formData.consignee?.stateName || ''}
                  onChange={(v) =>
                    setFormData(prev => ({
                      ...prev,
                      consignee: { ...(prev.consignee || {}), stateName: v } as Client
                    }))
                  }
                />

                <InputGroup
                  label="State Code"
                  value={formData.consignee?.stateCode || ''}
                  onChange={(v) =>
                    setFormData(prev => ({
                      ...prev,
                      consignee: { ...(prev.consignee || {}), stateCode: v } as Client
                    }))
                  }
                />

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                    Address
                  </label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-medium text-black"
                    value={formData.consignee?.address || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        consignee: { ...(prev.consignee || {}), address: val } as Client
                      }));
                    }}
                  />
                </div>
              </div>
            </section>


            <section className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <SectionHeader icon={Icons.New} title="Items" color="text-indigo-600" />
                <button onClick={handleAddItem} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-100 transition-colors">Add Row</button>
              </div>
              <div className="space-y-6">
                {formData.items.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-1 gap-4 bg-slate-50/50 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-300 relative group">
                    <button onClick={() => handleRemoveItem(item.id)} className="absolute top-2 right-2 p-2 text-slate-400 hover:text-rose-500 transition-all"><Icons.Delete className="w-4 h-4" /></button>
                    <div className="w-full"><InputGroup label="Description" value={item.description} onChange={(v) => handleItemChange(item.id, 'description', v)} /></div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <InputGroup label="HSN" value={item.hsn} onChange={(v) => handleItemChange(item.id, 'hsn', v)} />
                      <InputGroup label="Qty" type="number" value={item.quantity.toString()} onChange={(v) => handleItemChange(item.id, 'quantity', parseFloat(v) || 0)} />
                      <InputGroup label="Unit" value={item.unit} onChange={(v) => handleItemChange(item.id, 'unit', v)} />
                      <InputGroup label="Rate" type="number" value={item.unitPrice.toString()} onChange={(v) => handleItemChange(item.id, 'unitPrice', parseFloat(v) || 0)} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="space-y-6 md:space-y-10 lg:sticky lg:top-10 self-start no-print">
          <div className="bg-slate-900 text-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="relative z-10 space-y-4 md:space-y-5">
              <div className="flex items-center gap-3"><Icons.AI className="w-6 h-6 md:w-7 md:h-7 text-indigo-400" /><h3 className="text-lg font-black uppercase tracking-tighter">AI Quick Fill</h3></div>
              <p className="text-xs text-slate-400 font-medium">Extract line items instantly.</p>
              <textarea rows={4} placeholder="Paste items here..." className="w-full bg-slate-800 border-none rounded-2xl p-4 text-sm text-white placeholder-slate-500 outline-none transition-all resize-none shadow-inner" value={aiInput} onChange={(e) => setAiInput(e.target.value)} />
              <button onClick={handleAiExtract} disabled={isAiLoading || !aiInput.trim()} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black uppercase transition-all flex items-center justify-center gap-3 text-[10px] md:text-xs tracking-widest">
                {isAiLoading ? <div className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full" /> : <><Icons.Sparkles className="w-4 h-4" /> Auto Extract</>}
              </button>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-300 shadow-xl space-y-6">
             <div className="flex justify-between items-center text-slate-500 text-[10px] font-black uppercase tracking-widest"><span>Taxable</span><span className="font-bold text-black">₹{subtotal.toLocaleString('en-IN')}</span></div>
             <div className="flex justify-between items-center text-slate-500 text-[10px] font-black uppercase tracking-widest pb-4 border-b border-slate-100"><span>Tax</span><span className="font-bold text-black">₹{totalTax.toLocaleString('en-IN')}</span></div>
             <div className="flex justify-between items-center"><p className="text-[11px] font-black text-black uppercase tracking-widest">Total</p><p className="text-2xl md:text-3xl font-black text-indigo-600 tracking-tighter">₹{totalAmount.toLocaleString('en-IN')}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionHeader = ({ icon: Icon, title, color }: { icon: any, title: string, color: string }) => (
  <div className="flex items-center gap-3 mb-2"><div className={`w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></div><h3 className="text-base md:text-lg font-bold text-black uppercase tracking-tight">{title}</h3></div>
);

const InputGroup = ({ label, value, type = "text", onChange }: { label: string, value: string, type?: string, onChange: (val: string) => void }) => (
  <div className="space-y-1"><label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{label}</label><input type={type} className="w-full px-4 py-3 md:py-3.5 rounded-xl border border-slate-300 bg-white focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm font-medium text-black shadow-sm" value={value || ''} onChange={(e) => onChange(e.target.value)} /></div>
);

export default InvoiceEditor;