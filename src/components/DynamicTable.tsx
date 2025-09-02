import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from './FormField';
import { ArrayField, FormField as FormFieldType } from '@/types/invoice';
import { Plus, Trash2, Calculator } from 'lucide-react';

interface DynamicTableProps {
  field: ArrayField;
  className?: string;
}

export const DynamicTable: React.FC<DynamicTableProps> = ({ field, className = '' }) => {
  const { control, watch } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: field.name
  });

  const watchedItems = watch(field.name) || [];

  const addItem = () => {
    const defaultItem: Record<string, any> = {};
    field.items.forEach(item => {
      defaultItem[item.name] = item.type === 'number' ? 0 : '';
    });
    append(defaultItem);
  };

  const removeItem = (index: number) => {
    remove(index);
  };

  const calculateRowTotal = (index: number) => {
    const item = watchedItems[index];
    if (item && typeof item.quantity === 'number' && typeof item.unit_price === 'number') {
      return item.quantity * item.unit_price;
    }
    return 0;
  };

  const updateRowTotal = (index: number) => {
    const total = calculateRowTotal(index);
    const currentItems = watchedItems[index];
    if (currentItems) {
      currentItems.total = total;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-semibold">
            {field.name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </span>
          <Button
            type="button"
            onClick={addItem}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No items added yet</p>
            <Button
              type="button"
              onClick={addItem}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Add First Item
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((item, index) => (
              <Card key={item.id} className="border-dashed">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    <Button
                      type="button"
                      onClick={() => removeItem(index)}
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {field.items.map((subField) => (
                      <FormField
                        key={`${field.name}.${index}.${subField.name}`}
                        name={`${field.name}.${index}.${subField.name}`}
                        type={subField.type}
                        label={subField.label}
                        placeholder={subField.placeholder}
                        required={subField.required}
                        validation={subField.validation}
                        className="col-span-1"
                      />
                    ))}
                  </div>
                  
                  {/* Auto-calculate total for items */}
                  {field.name === 'items' && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Row Total:</span>
                        <span className="text-lg font-semibold">
                          ${calculateRowTotal(index).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {/* Summary section for items */}
            {field.name === 'items' && fields.length > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Total Items: {fields.length}</span>
                    <span className="text-lg font-semibold text-primary">
                      ${watchedItems.reduce((sum: number, item: any) => sum + (item.total || 0), 0).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
