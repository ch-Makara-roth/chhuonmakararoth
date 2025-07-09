import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const startTime = Date.now();

    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    const dbResponseTime = Date.now() - startTime;

    // Basic health check response
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: {
          status: 'healthy',
          responseTime: `${dbResponseTime}ms`
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB'
        },
        cpu: {
          loadAverage: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0]
        }
      }
    };

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);

    const errorData = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: {
        database: {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Database connection failed'
        }
      }
    };

    return NextResponse.json(errorData, { status: 503 });
  } finally {
    await prisma.$disconnect();
  }
}
