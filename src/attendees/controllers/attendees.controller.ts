import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { AttendeesService } from '../services/attendees.service';
import { CreateAttendeeDto } from '../dto/create-attendee.dto';
import { UpdateAttendeeDto } from '../dto/update-attendee.dto';
import { BulkUploadResponseDto } from '../dto/bulk-upload-attendee.dto';
import { FileProcessingService } from '../services/file-processing.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BulkUploadJobsService } from '../../jobs/services/bulk-upload-jobs.service';
import { BulkUploadJob } from '../../jobs/entities/bulk-upload-job.entity';

@ApiTags('Attendees')
@Controller('attendees')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt-auth')
export class AttendeesController {
  constructor(
    private readonly attendeesService: AttendeesService,
    private readonly fileProcessingService: FileProcessingService,
    private readonly bulkUploadJobsService: BulkUploadJobsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new attendee',
    description: 'Creates a new event attendee',
  })
  @ApiBody({
    type: CreateAttendeeDto,
    description: 'Attendee data',
  })
  @ApiResponse({
    status: 201,
    description: 'Attendee created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation errors',
  })
  create(@Body() createAttendeeDto: CreateAttendeeDto) {
    return this.attendeesService.create(createAttendeeDto);
  }

  @Post('bulk')
  @ApiOperation({
    summary: 'Create multiple attendees',
    description: 'Creates multiple event attendees in bulk',
  })
  @ApiBody({
    type: [CreateAttendeeDto],
    description: 'Array of attendee data',
  })
  @ApiResponse({
    status: 201,
    description: 'Attendees created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation errors',
  })
  bulkCreate(@Body() createAttendeesDto: CreateAttendeeDto[]) {
    return this.attendeesService.bulkCreate(createAttendeesDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all attendees',
    description: 'Retrieves all event attendees',
  })
  @ApiResponse({
    status: 200,
    description: 'List of attendees retrieved successfully',
  })
  findAll() {
    return this.attendeesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get attendee by ID',
    description: 'Retrieves a specific attendee by their ID',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Attendee ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Attendee retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Attendee not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.attendeesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update attendee',
    description: 'Updates an existing attendee',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Attendee ID',
    example: 1,
  })
  @ApiBody({
    type: UpdateAttendeeDto,
    description: 'Updated attendee data',
  })
  @ApiResponse({
    status: 200,
    description: 'Attendee updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Attendee not found',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAttendeeDto: UpdateAttendeeDto,
  ) {
    return this.attendeesService.update(id, updateAttendeeDto);
  }

  @Post('bulk-upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Create bulk upload job',
    description:
      'Creates an asynchronous job to process CSV or Excel file with attendee data and optional certificate association',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File upload with attendee data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV or Excel file with attendee data',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Bulk upload job created successfully',
    type: BulkUploadJob,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid file or format',
  })
  async bulkUpload(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ): Promise<BulkUploadJob> {
    return this.bulkUploadJobsService.createJob(
      file.originalname,
      Number(req.user.id),
      file,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete attendee',
    description: 'Deletes an existing attendee',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Attendee ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Attendee deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Attendee not found',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.attendeesService.remove(id);
  }
}
