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
  /*
  @Post()
  @ApiOperation({
    summary: 'Create a new event attendee record',
    description:
      'Creates a new attendee record in the system with complete personal information including full name, email, country, document details, and gender. Validates all required fields and ensures email uniqueness. The created attendee can then be used for certificate generation and event participation tracking.',
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
    summary: 'Create multiple attendees in a single operation',
    description:
      'Creates multiple attendee records simultaneously from an array of attendee data. Validates each record individually and provides detailed feedback about successful creations and validation errors. More efficient than creating attendees one by one, with transaction support to ensure data consistency.',
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
    summary: 'List all attendees in the system',
    description:
      'Retrieves a complete list of all registered attendees with their full personal information including names, emails, countries, document details, and registration timestamps. Useful for administrative overview, reporting, and selecting attendees for certificate generation.',
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

  */

  @Post('bulk-upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload CSV/Excel file for asynchronous attendee processing',
    description: `Creates an asynchronous job to process CSV or Excel files containing attendee data. 
    
**CSV Structure Required:**
The file must contain a header row with the following columns (order doesn't matter):

**Required Columns:**
- \`fullName\` - Full name of the attendee (e.g., "Carlos Andres Beltran Franco")
- \`email\` - Email address (e.g., "carlosandresbeltran89@gmail.com")
- \`country\` - Country name (e.g., "Colombia")
- \`documentType\` - Type of document (e.g., "CC", "Passport")
- \`documentNumber\` - Document number (e.g., "12345678")
- \`gender\` - Gender (e.g., "M", "F", "Masculino", "Femenino")

**Optional Columns:**
- \`firstName\` - First name only (e.g., "Carlos Andres")
- \`lastName\` - Last name only (e.g., "Beltran Franco")
- \`certificateId\` - ID of certificate to associate (e.g., 6)
- \`link1\` - Custom link 1 (e.g., "https://example.com/resource1")
- \`link2\` - Custom link 2 (e.g., "https://example.com/resource2")
- \`custom1\` - Custom field 1 (any text value)
- \`custom2\` - Custom field 2 (any text value)

**Example CSV Structure:**
\`\`\`csv
fullName,firstName,lastName,email,country,documentType,documentNumber,gender,certificateId,link1,link2,custom1,custom2
Carlos Andres Beltran Franco,,,carlosandresbeltran89@gmail.com,Colombia,CC,12345678,M,6,https://www.example.com/,,,
Patricia Daza De Herrera,,,pdaza@inmov.com,Colombia,CC,87654321,F,6,https://www.example.com/,,Custom Value,
\`\`\`

**SendGrid Template Variables:**
All attendee data is automatically sent to SendGrid templates. Use these variable names in your email templates:

**Standard Variables:**
- \`{{recipient_name}}\` or \`{{attendee_name}}\` - Full name of attendee
- \`{{certificate_name}}\` - Name of the certificate
- \`{{event_name}}\` - Name of the event
- \`{{event_link}}\` - URL link to the event
- \`{{download_link}}\` - URL to download the certificate PDF
- \`{{country}}\` - Attendee's country
- \`{{document_type}}\` - Type of document (CC, Passport, etc.)
- \`{{document_number}}\` - Document identification number

**Custom Variables (if provided in CSV):**
- \`{{link_1}}\` - Custom link 1 from CSV
- \`{{link_2}}\` - Custom link 2 from CSV
- \`{{custom_1}}\` - Custom field 1 from CSV
- \`{{custom_2}}\` - Custom field 2 from CSV

**Features:**
- Supports multiple column name formats in Spanish and English
- Validates data integrity per row
- Handles duplicate detection (same email AND document number)
- Provides detailed error reporting per row
- Processes asynchronously in background for large files
- All variables available in SendGrid templates regardless of PDF attachment`,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File upload with attendee data (CSV or Excel format)',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'CSV or Excel (.xlsx, .xls) file with attendee data following the structure described above',
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
    description:
      'Bad request - invalid file format or missing required columns',
  })
  async bulkUpload(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ): Promise<BulkUploadJob> {
    return this.bulkUploadJobsService.createJob(
      file.originalname,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      Number(req.user.id),
      file,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete an attendee record permanently',
    description:
      'Permanently removes an attendee from the system including all associated data. This operation cannot be undone and may affect existing generated certificates that reference this attendee. Use with caution as it impacts data integrity and historical records.',
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
