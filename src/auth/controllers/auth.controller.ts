import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginUserDto } from '../dto/login-user.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../interfaces/auth.interfaces';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Autentica un usuario',
  })
  @ApiBody({
    type: LoginUserDto,
    examples: {
      ejemplo1: {
        summary: 'Login con información de app',
        value: {
          username: 'inmov_admin',
          password: 'Inmov#123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token de acceso JWT generado exitosamente',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 123,
          username: 'BD1051',
          name: 'Juan',
          last_name: 'Pérez',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas',
    schema: {
      example: {
        statusCode: 401,
        message: 'Credenciales inválidas',
      },
    },
  })
  async login(@Body() loginUserDto: LoginUserDto) {
    loginUserDto.username = loginUserDto.username
      ? loginUserDto.username.toUpperCase()
      : '';

    const user = await this.authService.validateUser(
      loginUserDto.username,
      loginUserDto.password,
    );

    const loginResult = this.authService.login(user);

    return loginResult;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener usuario actual',
    description: 'Obtiene la información del usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Información del usuario autenticado',
    schema: {
      example: {
        id: 123,
        username: 'inmov_admin',
        name: 'Carlos',
        last_name: 'Beltran',
        email: 'cbeltran@inmov.com',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT inválido o no proporcionado',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  getProfile(@Request() req: { user: AuthenticatedUser }): AuthenticatedUser {
    return req.user;
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Renovar token de acceso',
    description: 'Genera un nuevo access token usando un refresh token válido',
  })
  @ApiBody({
    type: RefreshTokenDto,
    examples: {
      ejemplo1: {
        summary: 'Refresh token example',
        value: {
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens renovados exitosamente',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido o expirado',
    schema: {
      example: {
        statusCode: 401,
        message: 'Refresh token inválido',
      },
    },
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refresh(refreshTokenDto.refreshToken);
  }
}
