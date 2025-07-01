import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DataModelField } from '@/lib/dataModelUtils';

interface DynamicFormProps {
  fields: DataModelField[];
  defaultValues?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
  submitLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

export function DynamicForm({
  fields,
  defaultValues = {},
  onSubmit,
  onCancel,
  title = 'Form',
  description,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  isLoading = false
}: DynamicFormProps) {
  // Create Zod schema dynamically based on fields
  const createZodSchema = () => {
    const schemaObject: Record<string, any> = {};
    
    fields.forEach(field => {
      let fieldSchema: z.ZodTypeAny = z.string();
      
      switch (field.type) {
        case 'string':
          if (field.format === 'email') {
            fieldSchema = z.string().email('Invalid email address');
          } else {
            fieldSchema = z.string();
          }
          break;
        case 'number':
          fieldSchema = z.number().or(z.string().transform(val => Number(val)));
          break;
        case 'boolean':
          fieldSchema = z.boolean();
          break;
        case 'date':
          fieldSchema = z.string().or(z.date());
          break;
        case 'array':
          fieldSchema = z.array(z.string());
          break;
        case 'object':
          fieldSchema = z.record(z.any());
          break;
        default:
          fieldSchema = z.string();
      }
      
      if (field.required) {
        schemaObject[field.name] = fieldSchema;
      } else {
        schemaObject[field.name] = fieldSchema.optional();
      }
    });
    
    return z.object(schemaObject);
  };

  const schema = createZodSchema();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues
  });

  const handleSubmit = (data: z.infer<typeof schema>) => {
    onSubmit(data);
  };

  const renderField = (field: DataModelField) => {
    const fieldName = field.name as keyof z.infer<typeof schema>;
    
    return (
      <FormField
        key={field.name}
        control={form.control}
        name={fieldName}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>{field.label || field.name}</FormLabel>
            <FormControl>
              {field.type === 'textarea' ? (
                <Textarea
                  {...formField}
                  placeholder={`Enter ${field.label || field.name}`}
                  rows={4}
                />
              ) : field.type === 'boolean' ? (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={Boolean(formField.value)}
                    onCheckedChange={(checked) => formField.onChange(checked)}
                  />
                  <span className="text-sm text-muted-foreground">
                    {field.description}
                  </span>
                </div>
              ) : field.type === 'select' && field.enum ? (
                <Select onValueChange={formField.onChange} value={formField.value as string}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${field.label || field.name}`} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {field.enum.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'date' ? (
                <Input
                  {...formField}
                  type="date"
                  placeholder={`Select ${field.label || field.name}`}
                />
              ) : field.type === 'number' ? (
                <Input
                  {...formField}
                  type="number"
                  placeholder={`Enter ${field.label || field.name}`}
                />
              ) : (
                <Input
                  {...formField}
                  type={field.format === 'email' ? 'email' : 'text'}
                  placeholder={`Enter ${field.label || field.name}`}
                />
              )}
            </FormControl>
            {field.description && (
              <FormDescription>{field.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map(renderField)}
            </div>
            
            <div className="flex justify-end space-x-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  {cancelLabel}
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : submitLabel}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 