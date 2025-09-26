import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  Body,
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
import { RetryJobsDto } from '../dto/retry-jobs.dto';

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
    summary: 'List all email delivery jobs in the system',
    description:
      'Retrieves a comprehensive list of all email delivery jobs including their current status (pending, sent, error), associated certificate information, attendee details, attempt timestamps, and error messages if any. Jobs are returned with full relational data for monitoring and debugging purposes. Essential for system administration and email delivery tracking.',
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
    summary: 'Get all pending email jobs waiting for processing',
    description:
      'Retrieves all email jobs that are currently in pending status and waiting to be processed by the job scheduler. This endpoint is useful for monitoring the email queue size and identifying any backlogs in email delivery. Shows detailed information about each pending job including associated certificate and attendee data.',
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
    summary: 'Manually trigger processing of pending email jobs',
    description:
      'Immediately processes up to 10 pending email jobs from the queue instead of waiting for the scheduled job processor. This endpoint manually triggers the same job processing logic that runs automatically every 5 minutes. Useful for testing, urgent deliveries, or reducing queue backlogs. Returns statistics about successful and failed processing attempts.',
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
    summary: 'Retry a failed email delivery job',
    description:
      'Resets a failed email job back to pending status so it can be processed again by the job scheduler. This is useful when email delivery failed due to temporary issues like network problems or SendGrid service interruptions. The job will be picked up in the next processing cycle. Only works with jobs that have error status.',
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
    summary: 'Get detailed information for a specific email job',
    description:
      'Retrieves complete details for a specific email job including its current status, associated certificate information, attendee data, processing timestamps, error messages if failed, and delivery attempt history. Essential for debugging individual job issues and tracking email delivery status.',
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
    summary: 'Get automatic job scheduler status and statistics',
    description:
      'Returns the current operational status of the cron-based job scheduler that automatically processes email jobs every 5 minutes. Provides information about the last processing run, total jobs processed, success rates, and current scheduler state. Critical for monitoring the health of the automated email delivery system.',
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
    summary: 'Force immediate job processing outside schedule',
    description:
      'Bypasses the normal 5-minute cron schedule and immediately triggers job processing. Useful for urgent email deliveries or testing scenarios. Will not execute if automatic processing is already running to prevent conflicts. Returns processing statistics and prevents overlapping job executions.',
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
    summary: 'Get all bulk upload jobs for current user',
    description:
      "Retrieves all bulk upload jobs created by the authenticated user including their processing status, file information, record counts, error details, and processing timestamps. Provides complete visibility into the user's file upload history and processing results. Essential for tracking bulk import operations.",
  })
  @ApiResponse({
    status: 200,
    description: 'List of bulk upload jobs retrieved successfully',
    type: [BulkUploadJob],
  })
  async findUserBulkUploadJobs(@Request() req: any): Promise<BulkUploadJob[]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.bulkUploadJobsService.findByUser(Number(req.user.id));
  }

  @Get('bulk-upload/completed')
  @ApiOperation({
    summary: 'Get all completed and failed bulk upload jobs',
    description:
      'Retrieves all bulk upload jobs that have finished processing, whether successfully or with failures. Includes detailed statistics about records processed, success counts, error details, and processing times. Useful for administrative oversight and troubleshooting bulk import operations across all users.',
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
    summary: 'Get detailed information for a specific bulk upload job',
    description:
      'Retrieves complete details for a specific bulk upload job including processing status, file information, record statistics, detailed error information, processing timestamps, and associated user data. Essential for monitoring individual bulk import operations and debugging processing issues.',
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

  // Audit and Repair Endpoints

  @Get('audit/missing-pdfs')
  @ApiOperation({
    summary: 'Audit SENT jobs to find emails sent without PDF attachments',
    description:
      'Compares all jobs marked as SENT with the actual PDF files in S3 storage. Identifies discrepancies where emails were sent successfully but the PDF attachment was missing or failed to generate. This is crucial for data integrity and ensuring all recipients received their complete certificates. Returns detailed information about jobs that need to be re-sent.',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit completed successfully',
    schema: {
      type: 'object',
      properties: {
        totalSentJobs: { type: 'number' },
        jobsWithValidPdfs: { type: 'number' },
        jobsWithMissingPdfs: { type: 'number' },
        missingPdfJobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              jobId: { type: 'number' },
              certificateId: { type: 'number' },
              attendeeName: { type: 'string' },
              attendeeEmail: { type: 'string' },
              s3Url: { type: 'string' },
              s3Key: { type: 'string' },
              attemptedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  async auditMissingPdfs() {
    return await this.jobsService.auditJobsVsS3();
  }

  @Post('repair/retry-missing-pdfs')
  @ApiOperation({
    summary: 'Retry jobs that were sent without PDF attachments',
    description:
      'Resets specific jobs back to PENDING status so they can be reprocessed with proper PDF generation and email delivery. Use this endpoint after running the audit to fix jobs that were sent without attachments. The jobs will be picked up by the next processing cycle and will attempt to generate PDFs before sending emails.',
  })
  @ApiResponse({
    status: 200,
    description: 'Retry operation completed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        retriedJobs: { type: 'number' },
        skippedJobs: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  async retryMissingPdfs(@Body() retryJobsDto: RetryJobsDto) {
    const { jobIds } = retryJobsDto;

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return {
        success: false,
        retriedJobs: 0,
        skippedJobs: 0,
        message: 'No job IDs provided. Send jobIds array in request body.',
      };
    }

    return await this.jobsService.retryJobsWithMissingPdfs(jobIds);
  }
}
