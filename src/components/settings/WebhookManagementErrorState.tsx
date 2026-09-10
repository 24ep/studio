import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface WebhookManagementErrorStateProps {
  error: string;
}

export function WebhookManagementErrorState({ error }: WebhookManagementErrorStateProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>
            An error occurred while loading the webhook management interface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            {error}
          </div>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
