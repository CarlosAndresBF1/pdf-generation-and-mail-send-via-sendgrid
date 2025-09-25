import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Put,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { CertificatesService } from '../services/certificates.service';
import { DesignImageService } from '../services/design-image.service';
import { CreateCertificateDto } from '../dto/create-certificate.dto';
import { UpdateCertificateDto } from '../dto/update-certificate.dto';
import {
  UploadDesignImageDto,
  UploadDesignImageResponseDto,
} from '../dto/upload-design-image.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Certificates')
@Controller('certificates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt-auth')
export class CertificatesController {
  constructor(
    private readonly certificatesService: CertificatesService,
    private readonly designImageService: DesignImageService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new certificate configuration',
    description: 'Creates a new certificate configuration for events',
  })
  @ApiResponse({
    status: 201,
    description: 'Certificate configuration created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation errors',
  })
  create(@Body() createCertificateDto: CreateCertificateDto) {
    return this.certificatesService.create(createCertificateDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all certificate configurations',
    description: 'Retrieves all certificate configurations',
  })
  @ApiResponse({
    status: 200,
    description: 'List of certificate configurations retrieved successfully',
  })
  findAll() {
    return this.certificatesService.findAll();
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active certificate configurations',
    description: 'Retrieves only active certificate configurations',
  })
  @ApiResponse({
    status: 200,
    description:
      'List of active certificate configurations retrieved successfully',
  })
  findActive() {
    return this.certificatesService.findActive();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get certificate configuration by ID',
    description: 'Retrieves a specific certificate configuration by ID',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Certificate configuration ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Certificate configuration retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Certificate configuration not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.certificatesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update certificate configuration',
    description: 'Updates an existing certificate configuration',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Certificate configuration ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Certificate configuration updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Certificate configuration not found',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCertificateDto: UpdateCertificateDto,
  ) {
    return this.certificatesService.update(id, updateCertificateDto);
  }

  @Put(':id/toggle-active')
  @ApiOperation({
    summary: 'Toggle certificate configuration active status',
    description: 'Toggles the active status of a certificate configuration',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Certificate configuration ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Certificate configuration status toggled successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Certificate configuration not found',
  })
  toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.certificatesService.toggleActive(id);
  }

  @Post('upload-design')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({
    summary: 'Upload certificate design image',
    description:
      'Uploads an image file to S3 for use as certificate background design',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file upload with metadata',
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, WebP, SVG)',
        },
        name: {
          type: 'string',
          description: 'Nombre descriptivo para la imagen',
          example: 'Summit 2025 - Diseño Principal',
        },
        description: {
          type: 'string',
          description: 'Descripción adicional de la imagen',
          example: 'Diseño base para certificados del Summit 2025',
        },
        client: {
          type: 'string',
          description: 'Cliente al que pertenece el diseño',
          example: 'Nestlé',
        },
      },
      required: ['image', 'name'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    type: UploadDesignImageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid file or validation errors',
  })
  async uploadDesignImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadData: UploadDesignImageDto,
  ): Promise<UploadDesignImageResponseDto> {
    return this.designImageService.uploadDesignImage(file, uploadData);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete certificate configuration',
    description: 'Deletes an existing certificate configuration',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Certificate configuration ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Certificate configuration deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Certificate configuration not found',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.certificatesService.remove(id);
  }
}
