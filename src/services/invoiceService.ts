import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { BaseService, type ServiceResponse } from "./baseService";

type Invoice = Tables<'invoices'>;
type CreateInvoiceData = Omit<Invoice, 'id' | 'created_at' | 'updated_at'>;
type UpdateInvoiceData = Partial<Invoice>;

export class InvoiceService extends BaseService {
  static async getInvoices(): Promise<ServiceResponse<Invoice[]>> {
    const query = this.buildQuery('invoices', {
      sort: { column: 'created_at', ascending: false }
    });
    
    return this.executeQuery<Invoice[]>(query, 'InvoiceService.getInvoices');
  }

  static async getInvoiceById(id: string): Promise<ServiceResponse<Invoice>> {
    if (!this.validateId(id)) {
      return {
        data: null,
        error: 'Invalid invoice ID',
        success: false,
      };
    }

    const query = this.buildQuery('invoices', {
      filters: { id }
    }).single();
    
    return this.executeQuery<Invoice>(query, 'InvoiceService.getInvoiceById');
  }

  static async createInvoice(invoiceData: CreateInvoiceData): Promise<ServiceResponse<Invoice>> {
    const mutation = supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single();
    
    return this.executeMutation<Invoice>(mutation, 'InvoiceService.createInvoice');
  }

  static async updateInvoice(id: string, updates: UpdateInvoiceData): Promise<ServiceResponse<Invoice>> {
    if (!this.validateId(id)) {
      return {
        data: null,
        error: 'Invalid invoice ID',
        success: false,
      };
    }

    const mutation = supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return this.executeMutation<Invoice>(mutation, 'InvoiceService.updateInvoice');
  }

  static async deleteInvoice(id: string): Promise<ServiceResponse<void>> {
    if (!this.validateId(id)) {
      return {
        data: null,
        error: 'Invalid invoice ID',
        success: false,
      };
    }

    const mutation = supabase
      .from('invoices')
      .delete()
      .eq('id', id);
    
    return this.executeMutation<void>(mutation, 'InvoiceService.deleteInvoice');
  }

  static async getInvoiceStats(): Promise<ServiceResponse<{
    totalInvoices: number;
    totalRevenue: number;
    pendingInvoices: number;
  }>> {
    const query = this.buildQuery('invoices', {
      select: 'total, status'
    });
    
    const response = await this.executeQuery<{ total: number; status: string }[]>(query, 'InvoiceService.getInvoiceStats');
    
    if (!response.success || !response.data) {
      return response as any;
    }

    const invoices = response.data;
    const totalInvoices = invoices.length;
    const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const pendingInvoices = invoices.filter(invoice => 
      invoice.status === 'draft' || invoice.status === 'sent'
    ).length;

    return {
      data: {
        totalInvoices,
        totalRevenue,
        pendingInvoices
      },
      error: null,
      success: true,
    };
  }
}
