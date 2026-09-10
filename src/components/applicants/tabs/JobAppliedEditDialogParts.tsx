import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmployeeOption } from '@/components/hr/EmployeeOption';

type SelectOption = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

type JobAppliedSelectEditDialogProps = {
  fieldId: string;
  isUpdating: boolean;
  items: SelectOption[];
  label: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  onValueChange: (value: string) => void;
  open: boolean;
  placeholder: string;
  requireValue?: boolean;
  showAvatars?: boolean;
  title: string;
  value: string;
  emptyOption?: {
    label: string;
    value: string;
  };
};

export function JobAppliedSelectEditDialog({
  emptyOption,
  fieldId,
  isUpdating,
  items,
  label,
  onOpenChange,
  onSubmit,
  onValueChange,
  open,
  placeholder,
  requireValue = false,
  showAvatars = false,
  title,
  value,
}: JobAppliedSelectEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor={fieldId}>{label}</Label>
            <Select value={value} onValueChange={onValueChange}>
              <SelectTrigger id={fieldId}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {emptyOption ? <SelectItem value={emptyOption.value}>{emptyOption.label}</SelectItem> : null}
                {items.map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    {showAvatars ? <EmployeeOption name={item.name} avatarUrl={item.avatarUrl} /> : item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isUpdating || (requireValue && !value)}>
            {isUpdating ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type JobAppliedSalaryEditDialogProps = {
  isUpdating: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  onValueChange: (value: string) => void;
  open: boolean;
  value: string;
};

export function JobAppliedSalaryEditDialog({
  isUpdating,
  onOpenChange,
  onSubmit,
  onValueChange,
  open,
  value,
}: JobAppliedSalaryEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Expected Salary</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="salary">Expected Salary (THB/month)</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">THB</span>
              <input
                id="salary"
                type="number"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-12 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g. 50000"
                value={value}
                onChange={event => onValueChange(event.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isUpdating}>
            {isUpdating ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
