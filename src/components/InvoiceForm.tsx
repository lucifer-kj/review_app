import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Invoice } from "@/types";
import { Calendar } from "@/components/ui/calendar";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const invoiceSchema = z.object({
  customer_name: z.string().min(1, "Customer name is required"),
  customer_email: z.string().email("Invalid email address"),
  customer_address: z.string().optional(),
  customer_phone: z.string().optional(),
  item_description: z.string().min(1, "Item description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unit_price: z.number().min(0.01, "Unit price must be greater than 0"),
  currency: z.string().default("USD"),
  due_date: z.date().optional(),
  status: z.enum(["draft", "sent", "paid", "overdue"]).default("draft"),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  onSuccess: () => void;
  invoice?: Invoice;
}

export const InvoiceForm = ({ onSuccess, invoice }: InvoiceFormProps) => {
  const [loading, setLoading] = useState(false);
  const [dueDate, setDueDate] = useState<Date>();
  const { toast } = useToast();
  const isEditing = !!invoice;
  type DraftData = Partial<InvoiceFormData> & { due_date_str?: string };
  const [draft, setDraft] = useLocalStorage<DraftData>("invoice-form-draft", {});

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      currency: "USD",
      status: "draft",
      quantity: 1,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (invoice) {
      reset({
        customer_name: invoice.customer_name,
        customer_email: invoice.customer_email,
        customer_address: invoice.customer_address || "",
        customer_phone: invoice.customer_phone || "",
        item_description: invoice.item_description,
        quantity: invoice.quantity,
        unit_price: invoice.unit_price,
        currency: invoice.currency,
        status: invoice.status as "draft" | "sent" | "paid" | "overdue",
        notes: invoice.notes || "",
      });
      
      if (invoice.due_date) {
        setDueDate(new Date(invoice.due_date));
      }
    }
  }, [invoice, reset]);

  // Hydrate from localStorage draft when creating new
  useEffect(() => {
    if (!isEditing && draft && Object.keys(draft).length > 0) {
      reset({
        customer_name: draft.customer_name || "",
        customer_email: draft.customer_email || "",
        customer_address: draft.customer_address || "",
        customer_phone: draft.customer_phone || "",
        item_description: draft.item_description || "",
        quantity: typeof draft.quantity === 'number' ? draft.quantity : 1,
        unit_price: typeof draft.unit_price === 'number' ? draft.unit_price : 0,
        currency: draft.currency || "USD",
        status: (draft.status as any) || "draft",
        notes: draft.notes || "",
      });
      if (draft.due_date_str) {
        const parsed = new Date(draft.due_date_str);
        if (!isNaN(parsed.getTime())) setDueDate(parsed);
      }
    }
  }, [isEditing, draft, reset]);

  const quantity = watch("quantity") || 1;
  const unitPrice = watch("unit_price") || 0;
  const total = quantity * unitPrice;

  // Persist draft while creating
  const values = watch();
  useEffect(() => {
    if (!isEditing) {
      setDraft({
        ...(values as DraftData),
        due_date_str: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
      });
    }
  }, [values, dueDate, isEditing, setDraft]);

  // Generate invoice number
  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}-${random}`;
  };

  const onSubmit = async (data: InvoiceFormData) => {
    setLoading(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to manage invoices.",
          variant: "destructive",
        });
        return;
      }

      const invoiceData = {
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_address: data.customer_address || null,
        customer_phone: data.customer_phone || null,
        item_description: data.item_description,
        quantity: data.quantity,
        unit_price: data.unit_price,
        total: total,
        currency: data.currency,
        due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
        status: data.status as "draft" | "sent" | "paid" | "overdue",
        notes: data.notes || null,
        updated_at: new Date().toISOString()
      };

      if (isEditing && invoice) {
        // Update existing invoice
        const { error } = await supabase
          .from('invoices')
          .update(invoiceData)
          .eq('id', invoice.id);

        if (error) throw error;

        toast({
          title: "Invoice Updated",
          description: `Invoice ${invoice.invoice_number} has been updated successfully.`,
        });
      } else {
        // Create new invoice
        const { error } = await supabase
          .from('invoices')
          .insert({
            ...invoiceData,
            invoice_number: generateInvoiceNumber(),
            user_id: user.id
          });

        if (error) throw error;

        toast({
          title: "Invoice Created",
          description: `Invoice has been created successfully.`,
        });
      }

      onSuccess();
      if (!isEditing) {
        setDraft({});
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customer_name">Customer Name *</Label>
          <Input
            id="customer_name"
            {...register("customer_name")}
            placeholder="John Doe"
          />
          {errors.customer_name && (
            <p className="text-sm text-destructive">{errors.customer_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer_email">Customer Email *</Label>
          <Input
            id="customer_email"
            type="email"
            {...register("customer_email")}
            placeholder="john@example.com"
          />
          {errors.customer_email && (
            <p className="text-sm text-destructive">{errors.customer_email.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customer_address">Customer Address</Label>
          <Textarea
            id="customer_address"
            {...register("customer_address")}
            placeholder="123 Main St, City, State 12345"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer_phone">Customer Phone</Label>
          <Input
            id="customer_phone"
            {...register("customer_phone")}
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="item_description">Item Description *</Label>
        <Textarea
          id="item_description"
          {...register("item_description")}
          placeholder="Describe the product or service..."
          rows={2}
        />
        {errors.item_description && (
          <p className="text-sm text-destructive">{errors.item_description.message}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            {...register("quantity", { valueAsNumber: true })}
          />
          {errors.quantity && (
            <p className="text-sm text-destructive">{errors.quantity.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit_price">Unit Price *</Label>
          <Input
            id="unit_price"
            type="number"
            min="0"
            step="0.01"
            {...register("unit_price", { valueAsNumber: true })}
          />
          {errors.unit_price && (
            <p className="text-sm text-destructive">{errors.unit_price.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Total</Label>
          <Input
            value={`$${total.toFixed(2)}`}
            disabled
            className="bg-muted"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select
            defaultValue="USD"
            onValueChange={(value) => setValue("currency", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            defaultValue="draft"
            onValueChange={(value) => setValue("status", value as "draft" | "sent" | "paid" | "overdue")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          placeholder="Additional notes or terms..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Update Invoice" : "Create Invoice"}
        </Button>
      </div>
    </form>
  );
};