import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JobsService } from '../services/jobs.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Email Jobs')
@Controller('jobs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt-auth')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

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
}
