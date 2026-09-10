import { Settings } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { CustomFieldSectionProps } from './CustomFieldModalSectionTypes';

export function CustomFieldDisplaySettingsSection({ control }: CustomFieldSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Display Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={control}
          name="sort_order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sort Order</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0"
                  {...field}
                  onChange={(event) => field.onChange(parseInt(event.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>
                Lower numbers appear first in lists
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
