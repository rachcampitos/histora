import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Public } from '../common/decorators';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
    };
    memory: {
      status: 'up' | 'down';
      used: number;
      total: number;
      percentage: number;
    };
  };
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async check(): Promise<HealthStatus> {
    const startTime = Date.now();

    // Check database connection
    let dbStatus: 'up' | 'down' = 'down';
    let dbResponseTime: number | undefined;

    try {
      const dbStart = Date.now();
      if (this.connection.db) {
        await this.connection.db.admin().ping();
      }
      dbResponseTime = Date.now() - dbStart;
      dbStatus = 'up';
    } catch {
      dbStatus = 'down';
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const totalMem = require('os').totalmem();
    const memPercentage = (memUsage.heapUsed / totalMem) * 100;
    const memStatus = memPercentage < 90 ? 'up' : 'down';

    const isHealthy = dbStatus === 'up' && memStatus === 'up';

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: {
          status: dbStatus,
          responseTime: dbResponseTime,
        },
        memory: {
          status: memStatus,
          used: Math.round(memUsage.heapUsed / 1024 / 1024),
          total: Math.round(totalMem / 1024 / 1024),
          percentage: Math.round(memPercentage * 100) / 100,
        },
      },
    };
  }

  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes/Railway' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  live(): { status: string } {
    return { status: 'ok' };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe for Kubernetes/Railway' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async ready(): Promise<{ status: string; database: string }> {
    try {
      if (this.connection.db) {
        await this.connection.db.admin().ping();
      }
      return { status: 'ok', database: 'connected' };
    } catch {
      return { status: 'error', database: 'disconnected' };
    }
  }
}
