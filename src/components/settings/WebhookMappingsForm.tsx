import React from 'react';

interface WebhookMappingsFormProps {
  open: boolean;
  mapping: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const WebhookMappingsForm: React.FC<WebhookMappingsFormProps> = ({ open, mapping, onClose, onSubmit }) => {
  if (!open) return null;
  return (
    <div>
      <h2>Webhook Mappings Form</h2>
      {/* Webhook mappings form UI here */}
    </div>
  );
};

export default WebhookMappingsForm; 