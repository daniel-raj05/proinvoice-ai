
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  hsn: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface Client {
  id?: string;
  user_id?: string;
  name: string;
  email: string;
  address: string;
  phone?: string;
  gstin?: string;
  stateName?: string;
  stateCode?: string;
  created_at?: string;
}

export interface BusinessDetails {
  name: string;
  email: string;
  address: string;
  phone: string;
  website?: string;
  logo?: string;
  gstin: string;
  stateName: string;
  stateCode: string;
  bankName: string;
  accountNo: string;
  ifsc: string;
  branch: string;
  declaration?: string;
}

export type InvoiceStatus = 'Pending' | 'Finished' | 'Delayed';

export interface Invoice {
  id: string;
  user_id?: string;
  client_id?: string; // Links to Client table
  invoiceNumber: string;
  date: string;
  dueDate: string;
  client: Client; // Keep for UI and pre-filled data
  consignee?: Client;
  items: InvoiceItem[];
  notes: string;
  taxRate: number; 
  discount: number;
  status: InvoiceStatus;
  currency: string;
  deliveryNote?: string;
  paymentTerms?: string;
  buyersOrderNo?: string;
  orderDate?: string;
  dispatchDocNo?: string;
  deliveryNoteDate?: string;
  dispatchedThrough?: string;
  destination?: string;
  lrNo?: string;
  vehicleNo?: string;
  termsOfDelivery?: string;
  declaration?: string;
  supplierStateName?: string;
  supplierStateCode?: string;
  total_amount?: number; // Calculated for DB
  created_at?: string;
}

export interface AppState {
  user: User | null;
  invoices: Invoice[];
  clients: Client[];
  business: BusinessDetails;
}
