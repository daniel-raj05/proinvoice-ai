
import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  Settings, 
  Search, 
  ChevronRight, 
  Download, 
  Printer, 
  Mail, 
  Sparkles,
  Trash2,
  Copy,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Building2,
  CreditCard,
  Users,
  Pencil,
  Lock,
  Menu,
  X
} from 'lucide-react';

export const Icons = {
  Dashboard: LayoutDashboard,
  Invoices: FileText,
  Clients: Users,
  New: PlusCircle,
  Settings: Settings,
  Search: Search,
  ChevronRight: ChevronRight,
  Download: Download,
  Print: Printer,
  Email: Mail,
  AI: Sparkles,
  Sparkles: Sparkles,
  Delete: Trash2,
  Edit: Pencil,
  Duplicate: Copy,
  StatusPending: Clock,
  StatusPaid: CheckCircle2,
  StatusOverdue: AlertCircle,
  Logistics: Truck,
  Business: Building2,
  Bank: CreditCard,
  Lock: Lock,
  Menu: Menu,
  X: X
};

export const INITIAL_BUSINESS: any = {
  name: 'Jakeerthana Fab Industries',
  email: 'jakeerthana@industries.com',
  address: 'R14, Ganesh Street, Munusamy Street, Athipet, Chennai-600058',
  phone: '+91-98400 49873',
  gstin: '33BYHPD6347M1Z7',
  stateName: 'Tamil Nadu',
  stateCode: '33',
  bankName: 'Bank Of Baroda -Curent A/c',
  accountNo: '86600200001526',
  ifsc: 'BARB0DBATUR',
  branch: 'AMBATTUR',
  website: '',
  // FIXED GLOBAL LOGO: Navy Hexagon with Red Jki text
  logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHBhdGggZD0iTTEwMCAxMEwxNzcuOTQyIDU1VjE0NUwxMDAgMTkwTDIyLjA1NzcgMTQ1VjU1TDEwMCAxMFoiIHN0cm9rZT0iIzFBMzY1RCIgc3Ryb2tlLXdpZHRoPSIxNCIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTYlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjQzUzMDMwIiBzdHlsZT0iZm9udC1mYW1pbHk6ICdJbnRlcicsIHNhbnMtc2VyaWY7IGZvbnQtd2VpZ2h0OiA5MDA7IGZvbnQtc2l6ZTogODBweDsiPkpraTwvdGV4dD4KPC9zdmc+',
  declaration: 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
  defaultTerms: '1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if payment is not made within due date.\n3. Our responsibility ceases as soon as the goods leave our premises.\n4. Subject to Chennai Jurisdiction.'
};
