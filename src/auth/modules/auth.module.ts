import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from '../services/auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../guards/jwt.strategy';
import { AuthController } from '../controllers/auth.controller';
import { UsersModule } from '../../users/modules/users.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '30d' },
      }),
    }),
    UsersModule, // Importar el módulo de usuarios
  ],
  providers: [AuthService, JwtStrategy], // Registrar AuthService y JwtStrategy como providers
  controllers: [AuthController], // Registrar el controlador de autenticación
  exports: [AuthService], // Exportar AuthService para otros módulos
})
export class AuthModule {}
