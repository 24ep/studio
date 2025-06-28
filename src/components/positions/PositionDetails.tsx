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
      </CardContent>
    </Card>
  );
};

export default PositionDetails; 