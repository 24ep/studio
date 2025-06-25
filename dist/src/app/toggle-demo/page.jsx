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
    const handleToggleChange = (key, value) => {
        setToggles(prev => (Object.assign(Object.assign({}, prev), { [key]: value })));
    };
    return (<div className="container mx-auto p-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Toggle Component Demo</h1>
        <p className="text-muted-foreground">Showcasing the new custom Toggle component with different variants and sizes</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Toggle Variants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Default Variant</Label>
              <Toggle checked={toggles.default} onCheckedChange={(checked) => handleToggleChange('default', checked)} variant="default"/>
            </div>
            <div className="flex items-center justify-between">
              <Label>Success Variant</Label>
              <Toggle checked={toggles.success} onCheckedChange={(checked) => handleToggleChange('success', checked)} variant="success"/>
            </div>
            <div className="flex items-center justify-between">
              <Label>Warning Variant</Label>
              <Toggle checked={toggles.warning} onCheckedChange={(checked) => handleToggleChange('warning', checked)} variant="warning"/>
            </div>
            <div className="flex items-center justify-between">
              <Label>Danger Variant</Label>
              <Toggle checked={toggles.danger} onCheckedChange={(checked) => handleToggleChange('danger', checked)} variant="danger"/>
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
              <Toggle checked={toggles.small} onCheckedChange={(checked) => handleToggleChange('small', checked)} size="sm" variant="success"/>
            </div>
            <div className="flex items-center justify-between">
              <Label>Medium Size (Default)</Label>
              <Toggle checked={toggles.medium} onCheckedChange={(checked) => handleToggleChange('medium', checked)} size="md" variant="success"/>
            </div>
            <div className="flex items-center justify-between">
              <Label>Large Size</Label>
              <Toggle checked={toggles.large} onCheckedChange={(checked) => handleToggleChange('large', checked)} size="lg" variant="success"/>
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
            {Object.entries(toggles).map(([key, value]) => (<div key={key} className="text-center p-3 border rounded-lg">
                <div className="font-medium capitalize">{key}</div>
                <div className={`text-sm ${value ? 'text-green-600' : 'text-gray-500'}`}>
                  {value ? 'ON' : 'OFF'}
                </div>
              </div>))}
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
            <li>✅ Multiple variants: default, success, warning, danger</li>
            <li>✅ Multiple sizes: small, medium, large</li>
            <li>✅ Smooth animations and transitions</li>
            <li>✅ Accessible with proper ARIA attributes</li>
            <li>✅ Keyboard navigation support</li>
            <li>✅ Focus states and hover effects</li>
            <li>✅ Disabled state support</li>
          </ul>
        </CardContent>
      </Card>
    </div>);
}
