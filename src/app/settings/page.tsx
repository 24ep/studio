// src/app/settings/page.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { settingsNavItems } from './layout';
import Link from 'next/link';

export default function SettingsDashboardPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
      {settingsNavItems.map(item => (
        <Link key={item.href} href={item.href} className="block">
          <Card className="hover:shadow-xl transition-shadow h-full">
            <CardHeader className="flex flex-row items-center gap-4">
              <item.icon className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-lg">{item.label}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent />
          </Card>
        </Link>
      ))}
    </div>
  );
}
