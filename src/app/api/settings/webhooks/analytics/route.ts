export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import prisma from '@/lib/prisma';

import { auth } from '@/auth';
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session.user, 'WEBHOOK_ANALYTICS_VIEW')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to view webhook analytics' }, { status: 403 });
    }

    // Get date range for last 24 hours
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get total webhooks
    const totalWebhooks = await prisma.webhook.count();
    const activeWebhooks = await prisma.webhook.count({
      where: { is_active: true }
    });

    // Get delivery statistics for last 24 hours
    const deliveryStats = await prisma.webhookLog.aggregate({
      where: {
        createdAt: {
          gte: twentyFourHoursAgo
        }
      },
      _count: {
        id: true
      },
      _avg: {
        duration_ms: true
      }
    });

    // Get success/failure counts
    const successCount = await prisma.webhookLog.count({
      where: {
        createdAt: {
          gte: twentyFourHoursAgo
        },
        success: true
      }
    });

    const failureCount = await prisma.webhookLog.count({
      where: {
        createdAt: {
          gte: twentyFourHoursAgo
        },
        success: false
      }
    });

    const totalDeliveries = deliveryStats._count.id;
    const successRate = totalDeliveries > 0 ? (successCount / totalDeliveries) * 100 : 0;
    const avgResponseTime = deliveryStats._avg.duration_ms || 0;

    // Get recent activity (last 10 deliveries)
    const recentActivity = await prisma.webhookLog.findMany({
      where: {
        createdAt: {
          gte: twentyFourHoursAgo
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        event_type: true,
        success: true,
        response_status: true,
        createdAt: true,
        webhook: {
          select: {
            name: true
          }
        }
      }
    });

    // Get top failing webhooks
    const topFailingWebhooks = await prisma.webhookLog.groupBy({
      by: ['webhook_id'],
      where: {
        createdAt: {
          gte: twentyFourHoursAgo
        },
        success: false
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    // Get webhook names for top failing webhooks
    const failingWebhookDetails = await Promise.all(
      topFailingWebhooks.map(async (item) => {
        const webhook = await prisma.webhook.findUnique({
          where: { id: item.webhook_id },
          select: { name: true }
        });
        return {
          webhook_id: item.webhook_id,
          name: webhook?.name || 'Unknown',
          failure_count: item._count.id
        };
      })
    );

    return NextResponse.json({
      totalWebhooks,
      activeWebhooks,
      successRate,
      avgResponseTime,
      totalDeliveries,
      recentActivity,
      topFailingWebhooks: failingWebhookDetails,
      timeRange: {
        start: twentyFourHoursAgo.toISOString(),
        end: now.toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching webhook analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
