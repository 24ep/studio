import React from 'react';

interface PreferencesFormProps {
  open: boolean;
  preference: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const PreferencesForm: React.FC<PreferencesFormProps> = ({ open, preference, onClose, onSubmit }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Edit Preference</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit({});
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Key</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                defaultValue={preference?.key || ''}
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Value</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                defaultValue={preference?.value || ''}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PreferencesForm; 