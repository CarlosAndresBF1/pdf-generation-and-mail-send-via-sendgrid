import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JobsService } from '../services/jobs.service';
import { JobSchedulerService } from '../services/job-scheduler.service';
import { BulkUploadJobsService } from '../services/bulk-upload-jobs.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BulkUploadJob } from '../entities/bulk-upload-job.entity';

@ApiTags('Jobs')
@Controller('jobs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt-auth')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly jobSchedulerService: JobSchedulerService,
    private readonly bulkUploadJobsService: BulkUploadJobsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all email jobs',
    description: 'Retrieves all email jobs with their status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of email jobs retrieved successfully',
  })
  findAll() {
    return this.jobsService.findAll();
  }

  @Get('pending')
  @ApiOperation({
    summary: 'Get pending email jobs',
    description: 'Retrieves all pending email jobs',
  })
  @ApiResponse({
    status: 200,
    description: 'List of pending email jobs retrieved successfully',
  })
  findPending() {
    return this.jobsService.findPendingJobs();
  }

  @Post('process-pending')
  @ApiOperation({
    summary: 'Process pending email jobs',
    description: 'Processes all pending email jobs in the queue',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending jobs processing started',
  })
  processPending() {
    return this.jobsService.processPendingJobs();
  }

  @Post(':id/retry')
  @ApiOperation({
    summary: 'Retry failed email job',
    description: 'Retries a specific failed email job',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Job ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Job retry initiated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found',
  })
  retryJob(@Param('id', ParseIntPipe) id: number) {
    return this.jobsService.retryJob(id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get email job by ID',
    description: 'Retrieves a specific email job with its details',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Job ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Email job retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.jobsService.findOne(id);
  }

  @Get('scheduler/status')
  @ApiOperation({
    summary: 'Get cron scheduler status',
    description:
      'Returns the current status of the automatic job processing scheduler',
  })
  @ApiResponse({
    status: 200,
    description: 'Scheduler status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        isProcessing: { type: 'boolean' },
        nextExecutionIn: { type: 'string' },
      },
    },
  })
  getSchedulerStatus() {
    return this.jobSchedulerService.getSchedulerStatus();
  }

  @Post('scheduler/force')
  @ApiOperation({
    summary: 'Force manual job processing',
    description:
      'Manually triggers job processing outside of the scheduled cron cycle',
  })
  @ApiResponse({
    status: 200,
    description: 'Manual processing triggered successfully',
  })
  @ApiResponse({
    status: 409,
    description:
      'Cannot force processing while automatic processing is running',
  })
  async forceProcessing() {
    return await this.jobSchedulerService.forceProcessJobs();
  }

  // Bulk Upload Jobs Endpoints

  @Get('bulk-upload')
  @ApiOperation({
    summary: 'Get user bulk upload jobs',
    description: 'Returns all bulk upload jobs for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of bulk upload jobs retrieved successfully',
    type: [BulkUploadJob],
  })
  async findUserBulkUploadJobs(@Request() req: any): Promise<BulkUploadJob[]> {
    return this.bulkUploadJobsService.findByUser(Number(req.user.id));
  }

  @Get('bulk-upload/completed')
  @ApiOperation({
    summary: 'Get completed bulk upload jobs',
    description: 'Returns all completed or failed bulk upload jobs',
  })
  @ApiResponse({
    status: 200,
    description: 'List of completed bulk upload jobs retrieved successfully',
    type: [BulkUploadJob],
  })
  async findCompletedBulkUploadJobs(): Promise<BulkUploadJob[]> {
    return this.bulkUploadJobsService.findCompleted();
  }

  @Get('bulk-upload/:id')
  @ApiOperation({
    summary: 'Get bulk upload job by ID',
    description: 'Returns details of a specific bulk upload job',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Bulk upload job ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk upload job retrieved successfully',
    type: BulkUploadJob,
  })
  @ApiResponse({
    status: 404,
    description: 'Bulk upload job not found',
  })
  async findOneBulkUploadJob(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BulkUploadJob> {
    return this.bulkUploadJobsService.findOne(id);
  }
}
