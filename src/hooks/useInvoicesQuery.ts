import { useQuery } from '@tanstack/react-query';
import { InvoiceService } from '@/services/invoiceService';

type Params = {
  search?: string;
  status?: 'all' | 'draft' | 'sent' | 'paid' | 'overdue';
  page?: number;
  pageSize?: number;
};

export function useInvoicesQuery({ search = '', status = 'all', page = 1, pageSize = 20 }: Params) {
  return useQuery({
    queryKey: ['invoices', { search, status, page, pageSize }],
    queryFn: async () => {
      const res = await InvoiceService.getInvoices();
      if (!res.success || !res.data) throw new Error(res.error || 'Failed to fetch invoices');
      const filtered = res.data.filter((inv) => {
        const matchesSearch = !search || inv.customer_name.toLowerCase().includes(search.toLowerCase()) || inv.customer_email.toLowerCase().includes(search.toLowerCase()) || inv.invoice_number.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = status === 'all' || inv.status === status;
        return matchesSearch && matchesStatus;
      });
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      return { rows: filtered.slice(start, end), total: filtered.length };
    },
    staleTime: 30_000,
    keepPreviousData: true,
  });
}


