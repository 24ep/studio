import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Loader2, Save, X, BellRing, Mail, Webhook } from 'lucide-react';
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

interface NotificationSetting {
  id: string;
  eventId: string;
  channelId: string;
  isEnabled: boolean;
  configuration?: { webhookUrl?: string } | null;
  eventKey?: string;
  eventLabel?: string;
  channelKey?: 'email' | 'webhook';
  channelLabel?: string;
}

interface NotificationsFormProps {
  open: boolean;
  notification: NotificationSetting | null;
  onClose: () => void;
  onSubmit: (data: NotificationSetting) => void;
  isSaving?: boolean;
}

const notificationFormSchema = z.object({
  eventId: z.string().min(1, 'Event is required'),
  channelId: z.string().min(1, 'Channel is required'),
  isEnabled: z.boolean().default(true),
  webhookUrl: z.string().url().optional().or(z.literal('')),
});

type NotificationFormValues = z.infer<typeof notificationFormSchema>;

const NotificationsForm: React.FC<NotificationsFormProps> = ({ 
  open, 
  notification, 
  onClose, 
  onSubmit, 
  isSaving = false 
}) => {
  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      eventId: '',
      channelId: '',
      isEnabled: true,
      webhookUrl: '',
    },
  });

  useEffect(() => {
    if (notification) {
      form.reset({
        eventId: notification.eventId,
        channelId: notification.channelId,
        isEnabled: notification.isEnabled,
        webhookUrl: notification.configuration?.webhookUrl || '',
      });
    } else {
      form.reset({
        eventId: '',
        channelId: '',
        isEnabled: true,
        webhookUrl: '',
      });
    }
  }, [notification, form]);

  const handleSubmit = (data: NotificationFormValues) => {
    const notificationData: NotificationSetting = {
      id: notification?.id || '',
      eventId: data.eventId,
      channelId: data.channelId,
      isEnabled: data.isEnabled,
      configuration: data.webhookUrl ? { webhookUrl: data.webhookUrl } : null,
      eventKey: notification?.eventKey,
      eventLabel: notification?.eventLabel,
      channelKey: notification?.channelKey,
      channelLabel: notification?.channelLabel,
    };
    onSubmit(notificationData);
  };

  const watchChannelId = form.watch('channelId');
  const isWebhookChannel = watchChannelId === 'webhook';

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            {notification ? 'Edit Notification Setting' : 'Add Notification Setting'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="eventId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an event" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="candidate.created">Candidate Created</SelectItem>
                      <SelectItem value="candidate.updated">Candidate Updated</SelectItem>
                      <SelectItem value="candidate.deleted">Candidate Deleted</SelectItem>
                      <SelectItem value="position.created">Position Created</SelectItem>
                      <SelectItem value="position.updated">Position Updated</SelectItem>
                      <SelectItem value="position.deleted">Position Deleted</SelectItem>
                      <SelectItem value="user.created">User Created</SelectItem>
                      <SelectItem value="user.updated">User Updated</SelectItem>
                      <SelectItem value="system.alert">System Alert</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose which event should trigger this notification.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="channelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Channel</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a channel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </div>
                      </SelectItem>
                      <SelectItem value="webhook">
                        <div className="flex items-center gap-2">
                          <Webhook className="h-4 w-4" />
                          Webhook
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose how this notification should be delivered.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isWebhookChannel && (
              <FormField
                control={form.control}
                name="webhookUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Webhook URL</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://your-webhook-endpoint.com/notifications"
                        type="url"
                      />
                    </FormControl>
                    <FormDescription>
                      The URL where webhook notifications will be sent.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="isEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Notification</FormLabel>
                    <FormDescription>
                      Turn this notification on or off.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Toggle
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !form.formState.isValid}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationsForm; 