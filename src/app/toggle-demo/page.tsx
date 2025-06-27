"use client";

import { useState } from 'react';
import { Toggle } from '@/components/ui/toggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function ToggleDemoPage() {
  const [toggles, setToggles] = useState({
    default: false,
    success: true,
    warning: false,
    danger: true,
    small: false,
    medium: true,
    large: false,
  });

  const handleToggleChange = (key: string, value: boolean) => {
    setToggles(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Toggle Component Demo</h1>
        <p className="text-muted-foreground">Showcasing the new custom Toggle component with different sizes</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Toggle Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Default Toggle</Label>
              <Toggle
                checked={toggles.default}
                onCheckedChange={(checked) => handleToggleChange('default', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Success Toggle</Label>
              <Toggle
                checked={toggles.success}
                onCheckedChange={(checked) => handleToggleChange('success', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Warning Toggle</Label>
              <Toggle
                checked={toggles.warning}
                onCheckedChange={(checked) => handleToggleChange('warning', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Danger Toggle</Label>
              <Toggle
                checked={toggles.danger}
                onCheckedChange={(checked) => handleToggleChange('danger', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sizes */}
        <Card>
          <CardHeader>
            <CardTitle>Toggle Sizes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Small Size</Label>
              <Toggle
                checked={toggles.small}
                onCheckedChange={(checked) => handleToggleChange('small', checked)}
                size="sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Medium Size (Default)</Label>
              <Toggle
                checked={toggles.medium}
                onCheckedChange={(checked) => handleToggleChange('medium', checked)}
                size="md"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Large Size</Label>
              <Toggle
                checked={toggles.large}
                onCheckedChange={(checked) => handleToggleChange('large', checked)}
                size="lg"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* State Display */}
      <Card>
        <CardHeader>
          <CardTitle>Current States</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(toggles).map(([key, value]) => (
              <div key={key} className="text-center p-3 border rounded-lg">
                <div className="font-medium capitalize">{key}</div>
                <div className={`text-sm ${value ? 'text-green-600' : 'text-gray-500'}`}>
                  {value ? 'ON' : 'OFF'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>✅ Custom CSS-only implementation (no external dependencies)</li>
            <li>✅ Multiple sizes: small, medium, large</li>
            <li>✅ Smooth animations and transitions</li>
            <li>✅ Accessible with proper ARIA attributes</li>
            <li>✅ Keyboard navigation support</li>
            <li>✅ Focus states and hover effects</li>
            <li>✅ Disabled state support</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 