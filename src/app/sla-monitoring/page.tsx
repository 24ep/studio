import { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, AlertTriangle, Settings } from 'lucide-react';
import { SLAViolationsWidget } from '@/components/dashboard/SLAViolationsWidget';

export const metadata: Metadata = {
  title: 'SLA Monitoring - Studio 8',
  description: 'Monitor Service Level Agreement compliance for all positions',
};

export default function SLAMonitoringPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">SLA Monitoring</h1>
          <p className="text-muted-foreground mt-2">
            Monitor Service Level Agreement compliance across all positions and track hiring timeline violations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* All Positions SLA Monitoring */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-blue-400 rounded-full"></div>
            <div>
              <h2 className="text-xl font-bold text-foreground">All Positions</h2>
              <p className="text-sm text-muted-foreground mt-1">Complete SLA overview for all positions</p>
            </div>
          </div>
          <div className="h-[800px]">
            <SLAViolationsWidget />
          </div>
        </div>

        {/* Recruiter-Specific SLA Monitoring */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-1 bg-gradient-to-b from-green-500 to-green-400 rounded-full"></div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Your Positions</h2>
              <p className="text-sm text-muted-foreground mt-1">SLA monitoring for your assigned positions</p>
            </div>
          </div>
          <div className="h-[800px]">
            <SLAViolationsWidget recruiterId="current" />
          </div>
        </div>
      </div>

      {/* Additional SLA Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">SLA Guidelines</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Junior Positions</span>
              <Badge variant="outline">30 days</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Mid-Level Positions</span>
              <Badge variant="outline">45 days</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Senior Positions</span>
              <Badge variant="outline">60 days</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Lead Positions</span>
              <Badge variant="outline">90 days</Badge>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Status Definitions</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span>On Track - Within SLA timeline</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Warning - 7 days or less remaining</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>Critical - 1-30 days overdue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Urgent - 30+ days overdue</span>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/positions">
                <Eye className="h-4 w-4 mr-2" />
                View All Positions
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/positions?filter=overdue">
                <AlertTriangle className="h-4 w-4 mr-2" />
                View Overdue Positions
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                SLA Settings
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
