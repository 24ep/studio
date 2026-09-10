import { GripVertical, List, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ColorPicker } from '@/components/ui/color-picker';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CustomFieldOptionsSectionProps } from './CustomFieldModalSectionTypes';

export function CustomFieldOptionsSection({
  control,
  optionsFields,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
}: CustomFieldOptionsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="h-4 w-4" />
          Field Options
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <FormField
            control={control}
            name="allowCustomOptions"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Allow Custom Options</FormLabel>
                  <FormDescription>
                    Users can add new options when using this field
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddOption}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Option
          </Button>
        </div>

        {optionsFields.length > 0 && (
          <div className="space-y-3">
            <Label>Options</Label>
            {optionsFields.map((option, index) => (
              <div key={option.id} className="flex items-center gap-3 rounded-lg border p-3">
                <GripVertical className="h-4 w-4 text-muted-foreground" />

                <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
                  <Input
                    placeholder="Value"
                    value={option.value}
                    onChange={(event) => onUpdateOption(index, 'value', event.target.value)}
                  />
                  <Input
                    placeholder="Label"
                    value={option.label}
                    onChange={(event) => onUpdateOption(index, 'label', event.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <ColorPicker
                      value={option.color || '#3B82F6'}
                      onChange={(color) => onUpdateOption(index, 'color', color)}
                    />
                    <Input
                      value={option.color || '#3B82F6'}
                      onChange={(event) => onUpdateOption(index, 'color', event.target.value)}
                      className="w-20"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={option.isActive}
                    onCheckedChange={(checked) => onUpdateOption(index, 'isActive', checked)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveOption(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
