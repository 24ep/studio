import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExpandablePayload } from '@/components/ui/ExpandablePayload';
import { format } from 'date-fns';
import parseISO from 'date-fns/parseISO';
import { X, Calendar, User, Server, MessageSquare, AlertTriangle, Info, ShieldAlert, ListOrdered } from 'lucide-react';
import type { LogEntry } from '@/lib/types';

interface LogsFormProps {
  open: boolean;
  log: LogEntry | null;
  onClose: () => void;
}

const getLogLevelIcon = (level: string) => {
  switch (level) {
    case 'ERROR': return <AlertTriangle className="h-4 w-4" />;
    case 'WARN': return <AlertTriangle className="h-4 w-4" />;
    case 'AUDIT': return <ShieldAlert className="h-4 w-4" />;
    case 'INFO': return <Info className="h-4 w-4" />;
    case 'DEBUG': return <ListOrdered className="h-4 w-4" />;
    default: return <Info className="h-4 w-4" />;
  }
};

const getLogLevelBadgeVariant = (level: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (level) {
    case 'ERROR': return 'destructive';
    case 'WARN': return 'secondary';
    case 'AUDIT': return 'default';
    case 'INFO': return 'outline';
    case 'DEBUG': return 'outline';
    default: return 'outline';
  }
};

const LogsForm: React.FC<LogsFormProps> = ({ open, log, onClose }) => {
  if (!open || !log) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden" dialogId="logs-form-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getLogLevelIcon(log.level)}
            Log Entry Details
            <Badge variant={getLogLevelBadgeVariant(log.level)} className="ml-2">
              {log.level}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Timestamp
                </div>
                <div className="font-mono text-sm bg-muted p-2 rounded">
                  {format(parseISO(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="h-4 w-4" />
                  Acting User
                </div>
                <div className="text-sm bg-muted p-2 rounded">
                  {log.actingUserName || 'System'}
                </div>
              </div>
            </div>

            {/* Source Information */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Server className="h-4 w-4" />
                Source
              </div>
              <div className="text-sm bg-muted p-2 rounded">
                {log.source || 'Not specified'}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                Message
              </div>
              <div className="text-sm bg-muted p-2 rounded whitespace-pre-wrap">
                {log.message}
              </div>
            </div>

            {/* Additional Data */}
            {log.details && (
              <ExpandablePayload
                data={log.details}
                title="Additional Details"
                maxHeight="max-h-40"
                compact={true}
              />
            )}

            {/* Raw Log Data */}
            <ExpandablePayload
              data={log}
              title="Raw Log Data"
              maxHeight="max-h-40"
              compact={true}
            />
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LogsForm; 
