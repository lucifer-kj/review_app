import { useState, useEffect, useCallback } from "react";
import { InvoiceService } from "@/services/invoiceService";
import type { Tables } from "@/integrations/supabase/types";

type Invoice = Tables<'invoices'>;

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await InvoiceService.getInvoices();
      
      if (response.success && response.data) {
        setInvoices(response.data);
      } else {
        setError(response.error || 'Failed to fetch invoices');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invoices';
      setError(errorMessage);
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createInvoice = useCallback(async (invoiceData: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await InvoiceService.createInvoice(invoiceData);
      
      if (response.success && response.data) {
        // Refresh invoices list
        await fetchInvoices();
        return response.data;
      } else {
        setError(response.error || 'Failed to create invoice');
        throw new Error(response.error || 'Failed to create invoice');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create invoice';
      setError(errorMessage);
      throw err;
    }
  }, [fetchInvoices]);

  const updateInvoice = useCallback(async (id: string, updates: Partial<Invoice>) => {
    try {
      const response = await InvoiceService.updateInvoice(id, updates);
      
      if (response.success && response.data) {
        // Refresh invoices list
        await fetchInvoices();
        return response.data;
      } else {
        setError(response.error || 'Failed to update invoice');
        throw new Error(response.error || 'Failed to update invoice');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update invoice';
      setError(errorMessage);
      throw err;
    }
  }, [fetchInvoices]);

  const deleteInvoice = useCallback(async (id: string) => {
    try {
      const response = await InvoiceService.deleteInvoice(id);
      
      if (response.success) {
        // Refresh invoices list
        await fetchInvoices();
      } else {
        setError(response.error || 'Failed to delete invoice');
        throw new Error(response.error || 'Failed to delete invoice');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete invoice';
      setError(errorMessage);
      throw err;
    }
  }, [fetchInvoices]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return { 
    invoices, 
    loading, 
    error, 
    refetch: fetchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice
  };
};
