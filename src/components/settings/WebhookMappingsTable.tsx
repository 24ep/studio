import React from 'react';

interface WebhookMappingsTableProps {
  mappings: any[];
  isLoading: boolean;
  onEdit: (mapping: any) => void;
}

const WebhookMappingsTable: React.FC<WebhookMappingsTableProps> = ({ mappings, isLoading, onEdit }) => {
  return (
    <div>
      <h2>Webhook Mappings Table</h2>
      {/* Render webhook mappings in a table here */}
    </div>
  );
};

export default WebhookMappingsTable; 