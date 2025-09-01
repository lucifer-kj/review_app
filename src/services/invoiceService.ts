import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { handleError } from "@/utils/errorHandler";

type Invoice = Tables<'invoices'>;
type CreateInvoiceData = Omit<Invoice, 'id' | 'created_at' | 'updated_at'>;
type UpdateInvoiceData = Partial<Invoice>;

export class InvoiceService {
  static async getInvoices(): Promise<Invoice[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(handleError(error, 'InvoiceService.getInvoices'));
    }
  }

  static async getInvoiceById(id: string): Promise<Invoice> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(handleError(error, 'InvoiceService.getInvoiceById'));
    }
  }

  static async createInvoice(invoiceData: CreateInvoiceData): Promise<Invoice> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(handleError(error, 'InvoiceService.createInvoice'));
    }
  }

  static async updateInvoice(id: string, updates: UpdateInvoiceData): Promise<Invoice> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(handleError(error, 'InvoiceService.updateInvoice'));
    }
  }

  static async deleteInvoice(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      throw new Error(handleError(error, 'InvoiceService.deleteInvoice'));
    }
  }

  static async getInvoiceStats(): Promise<{
    totalInvoices: number;
    totalRevenue: number;
    pendingInvoices: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('total, status');

      if (error) throw error;

      const invoices = data || [];
      const totalInvoices = invoices.length;
      const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
      const pendingInvoices = invoices.filter(invoice => 
        invoice.status === 'draft' || invoice.status === 'sent'
      ).length;

      return {
        totalInvoices,
        totalRevenue,
        pendingInvoices
      };
    } catch (error) {
      throw new Error(handleError(error, 'InvoiceService.getInvoiceStats'));
    }
  }
}
