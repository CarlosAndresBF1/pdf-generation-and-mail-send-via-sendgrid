import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginUserDto } from '../dto/login-user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Autentica un usuario y opcionalmente registra información de la plataforma y versión de la aplicación',
  })
  @ApiBody({
    type: LoginUserDto,
    examples: {
      ejemplo1: {
        summary: 'Login con información de app iOS',
        value: {
          username: 'BD1051',
          password: 'password123',
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

    const loginResult = await this.authService.login(user);
    console.log('Login result:', loginResult);

    return loginResult;
  }
}
