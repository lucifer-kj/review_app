import { useEffect, useState, useMemo, useCallback, Suspense, lazy } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InvoiceListSkeleton } from "@/components/InvoiceSkeleton";
import { useInvoices } from "@/hooks/useInvoices";
import { Plus, Receipt, Eye, Search, Download, Filter, Edit, Trash2, FileText, DollarSign, Mail } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { InvoiceGenerationService } from "@/services/invoiceGenerationService";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { Invoice, InvoiceStatus } from "@/types";

const InvoiceForm = lazy(() => import("@/components/InvoiceForm").then(module => ({ default: module.InvoiceForm })));

const DashboardInvoices = () => {
  const { invoices, loading, error, refetch, deleteInvoice } = useInvoices();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch = 
        invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === "all" || invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'sent':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleInvoiceCreated = useCallback(() => {
    setIsCreateDialogOpen(false);
    refetch();
    toast({
      title: "Invoice Created",
      description: "New invoice has been created successfully.",
    });
  }, [refetch, toast]);

  const handleInvoiceUpdated = useCallback(() => {
    setIsEditDialogOpen(false);
    setSelectedInvoice(null);
    refetch();
    toast({
      title: "Invoice Updated",
      description: "Invoice has been updated successfully.",
    });
  }, [refetch, toast]);

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsEditDialogOpen(true);
  };

  const handleDeleteInvoice = useCallback(async (invoiceId: string) => {
    if (!confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteInvoice(invoiceId);
      toast({
        title: "Invoice Deleted",
        description: "Invoice has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete invoice. Please try again.",
        variant: "destructive",
      });
    }
  }, [deleteInvoice, toast]);

  const handleDownloadPDF = useCallback(async (invoice: Invoice) => {
    try {
      await InvoiceGenerationService.downloadInvoicePDF(invoice);
      toast({
        title: "PDF Downloaded",
        description: `Invoice ${invoice.invoice_number} has been downloaded as PDF.`,
      });
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download invoice PDF. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleSendEmail = useCallback(async (invoice: Invoice) => {
    try {
      await InvoiceGenerationService.sendInvoiceEmail(invoice);
      toast({
        title: "Email Sent",
        description: `Invoice ${invoice.invoice_number} has been sent to ${invoice.customer_email}.`,
      });
    } catch (error: any) {
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send invoice email. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const exportToCSV = useCallback(() => {
    try {
      const csvContent = [
        ['Invoice #', 'Customer', 'Email', 'Amount', 'Status', 'Due Date', 'Created'],
        ...filteredInvoices.map(invoice => [
          invoice.invoice_number,
          invoice.customer_name,
          invoice.customer_email,
          `${invoice.currency} ${Number(invoice.total).toFixed(2)}`,
          invoice.status,
          invoice.due_date ? format(new Date(invoice.due_date), 'yyyy-MM-dd') : '',
          format(new Date(invoice.created_at), 'yyyy-MM-dd HH:mm:ss')
        ])
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: `Exported ${filteredInvoices.length} invoices to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export invoices. Please try again.",
        variant: "destructive",
      });
    }
  }, [filteredInvoices, toast]);

  if (loading) {
    return <InvoiceListSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage and generate invoices for your customers
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={refetch} variant="outline" size="sm" className="flex-1 sm:flex-none text-sm">
            Refresh
          </Button>
          <Button onClick={exportToCSV} variant="outline" size="sm" className="flex-1 sm:flex-none text-sm">
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 sm:flex-none text-sm">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Create Invoice</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
                <DialogDescription>
                  Fill in the details to generate a new invoice
                </DialogDescription>
              </DialogHeader>
              <Suspense fallback={<LoadingSpinner />}>
                <InvoiceForm onSuccess={handleInvoiceCreated} />
              </Suspense>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">Filter Invoices</CardTitle>
          <CardDescription className="text-sm">
            Search and filter invoices to find what you need
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer, email, or invoice #..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-sm sm:text-base"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as InvoiceStatus | "all")}>
              <SelectTrigger className="w-full sm:w-[180px] text-sm sm:text-base">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">
              All time invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices.filter(inv => inv.status === 'paid').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <FileText className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices.filter(inv => inv.status === 'sent' || inv.status === 'draft').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${invoices.reduce((sum, inv) => sum + Number(inv.total), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total invoice value
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-lg sm:text-xl">All Invoices ({filteredInvoices.length})</CardTitle>
              <CardDescription className="text-sm">
                {error && (
                  <span className="text-destructive">Error loading invoices. 
                    <Button variant="link" onClick={refetch} className="p-0 h-auto ml-1">
                      Retry
                    </Button>
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-full inline-block align-middle">
              <div className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-2 sm:px-4 text-xs sm:text-sm">Invoice #</TableHead>
                      <TableHead className="px-2 sm:px-4 text-xs sm:text-sm">Customer</TableHead>
                      <TableHead className="px-2 sm:px-4 text-xs sm:text-sm">Amount</TableHead>
                      <TableHead className="px-2 sm:px-4 text-xs sm:text-sm">Status</TableHead>
                      <TableHead className="hidden sm:table-cell px-4 text-xs sm:text-sm">Due Date</TableHead>
                      <TableHead className="hidden lg:table-cell px-4 text-xs sm:text-sm">Created</TableHead>
                      <TableHead className="px-2 sm:px-4 text-xs sm:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {searchTerm || statusFilter !== "all" 
                            ? "No invoices found matching your filters" 
                            : "No invoices found. Create your first invoice to get started."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium px-2 sm:px-4 text-xs sm:text-sm lg:text-base">
                            {invoice.invoice_number}
                          </TableCell>
                          <TableCell className="px-2 sm:px-4">
                            <div>
                              <div className="font-medium text-xs sm:text-sm lg:text-base truncate">{invoice.customer_name}</div>
                              <div className="text-xs text-muted-foreground truncate">{invoice.customer_email}</div>
                            </div>
                          </TableCell>
                          <TableCell className="px-2 sm:px-4 text-xs sm:text-sm lg:text-base">
                            {invoice.currency} {Number(invoice.total).toFixed(2)}
                          </TableCell>
                          <TableCell className="px-2 sm:px-4">
                            <Badge variant={getStatusBadgeVariant(invoice.status)} className="text-xs">
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell px-4 text-xs sm:text-sm">
                            {invoice.due_date ? format(new Date(invoice.due_date), 'MMM dd, yyyy') : '-'}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell px-4 text-xs sm:text-sm text-muted-foreground">
                            {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell className="px-2 sm:px-4">
                            <div className="flex gap-1 flex-wrap">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDownloadPDF(invoice)}
                                title="Download PDF"
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                              >
                                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleSendEmail(invoice)}
                                title="Send Email"
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                              >
                                <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditInvoice(invoice)}
                                title="Edit Invoice"
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                              >
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteInvoice(invoice.id)}
                                title="Delete Invoice"
                                className="text-destructive hover:text-destructive h-7 w-7 sm:h-8 sm:w-8 p-0"
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Invoice Dialog */}
      {selectedInvoice && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
            <DialogHeader>
              <DialogTitle>Edit Invoice</DialogTitle>
              <DialogDescription>
                Update the invoice details
              </DialogDescription>
            </DialogHeader>
            <Suspense fallback={<LoadingSpinner />}>
              <InvoiceForm 
                invoice={selectedInvoice} 
                onSuccess={handleInvoiceUpdated} 
              />
            </Suspense>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DashboardInvoices;