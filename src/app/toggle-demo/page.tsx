"use client";

import { useState } from 'react';
import { Toggle } from '@/components/ui/toggle';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function ToggleDemoPage() {
  const [switches, setSwitches] = useState({
    default: false,
    success: true,
    warning: false,
    danger: true,
  });

  const [toggleStates, setToggleStates] = useState({
    bold: false,
    italic: false,
    underline: false,
  });

  const handleSwitchChange = (key: string, value: boolean) => {
    setSwitches(prev => ({ ...prev, [key]: value }));
  };

  const handleToggleChange = (key: string) => {
    setToggleStates(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Toggle & Switch Components Demo</h1>
        <p className="text-muted-foreground">Showcasing the difference between Toggle (button states) and Switch (on/off states)</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Switch Examples - for on/off states */}
        <Card>
          <CardHeader>
            <CardTitle>Switch Examples (On/Off States)</CardTitle>
            <p className="text-sm text-muted-foreground">Use Switch for on/off toggles like settings, notifications, etc.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Default Switch</Label>
              <Switch
                checked={switches.default}
                onCheckedChange={(checked) => handleSwitchChange('default', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Success Switch</Label>
              <Switch
                checked={switches.success}
                onCheckedChange={(checked) => handleSwitchChange('success', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Warning Switch</Label>
              <Switch
                checked={switches.warning}
                onCheckedChange={(checked) => handleSwitchChange('warning', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Danger Switch</Label>
              <Switch
                checked={switches.danger}
                onCheckedChange={(checked) => handleSwitchChange('danger', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Toggle Examples - for button states */}
        <Card>
          <CardHeader>
            <CardTitle>Toggle Examples (Button States)</CardTitle>
            <p className="text-sm text-muted-foreground">Use Toggle for button states like bold, italic, etc.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Text Formatting</Label>
              <div className="flex gap-2">
                <Toggle
                  pressed={toggleStates.bold}
                  onPressedChange={() => handleToggleChange('bold')}
                  aria-label="Toggle bold"
                >
                  B
                </Toggle>
                <Toggle
                  pressed={toggleStates.italic}
                  onPressedChange={() => handleToggleChange('italic')}
                  aria-label="Toggle italic"
                >
                  I
                </Toggle>
                <Toggle
                  pressed={toggleStates.underline}
                  onPressedChange={() => handleToggleChange('underline')}
                  aria-label="Toggle underline"
                >
                  U
                </Toggle>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Toggle Variants</Label>
              <div className="flex gap-2">
                <Toggle variant="default" size="sm">
                  Default
                </Toggle>
                <Toggle variant="outline" size="sm">
                  Outline
                </Toggle>
              </div>
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
            <div className="text-center p-3 border rounded-lg">
              <div className="font-medium">Switch States</div>
              <div className="text-sm text-muted-foreground">
                {Object.values(switches).filter(Boolean).length} ON
              </div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="font-medium">Toggle States</div>
              <div className="text-sm text-muted-foreground">
                {Object.values(toggleStates).filter(Boolean).length} Active
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Component Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Switch Component</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Use for on/off states (settings, notifications)</li>
                <li>• Based on Radix UI Switch primitive</li>
                <li>• Props: checked, onCheckedChange</li>
                <li>• Accessible with proper ARIA attributes</li>
                <li>• Standard toggle switch appearance</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Toggle Component</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Use for button states (bold, italic, etc.)</li>
                <li>• Based on Radix UI Slot primitive</li>
                <li>• Props: pressed, onPressedChange</li>
                <li>• Can contain children (text, icons)</li>
                <li>• Button-like appearance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 