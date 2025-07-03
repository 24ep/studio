import React from 'react';
import type { Position } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface PositionDetailsProps {
  position: Position | null;
}

const PositionDetails: React.FC<PositionDetailsProps> = ({ position }) => {
  if (!position) {
    return <div>No position data available.</div>;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Position Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div>Title: {position.title}</div>
        <div>Department: {position.department}</div>
        <div>Status: {position.isOpen ? 'Open' : 'Closed'}</div>
        {/* Add more fields as needed */}
        {position.webhook_payload && (
          <div style={{ marginTop: 24 }}>
            <h3 className="font-semibold mb-2">Webhook Log</h3>
            <div className="font-medium text-xs mb-1">Payload:</div>
            <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40 whitespace-pre-wrap">{JSON.stringify(position.webhook_payload, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PositionDetails; 