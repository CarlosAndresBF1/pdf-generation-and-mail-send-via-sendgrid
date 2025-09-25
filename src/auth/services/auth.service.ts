import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource } from '@nestjs/typeorm';
import { UsersService } from 'src/users/services/users.service';
import { DataSource } from 'typeorm';
import {
  JwtPayload,
  LoginResponse,
  RefreshResponse,
  AuthenticatedUser,
} from '../interfaces/auth.interfaces';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async validateUser(
    username: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    // Encuentra el usuario por nombre de usuario
    const user = await this.usersService.findByUsername(username);

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (await this.usersService.comparePassword(password, user.password)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: userPassword, ...result } = user;
      return result;
    }

    throw new UnauthorizedException('Credenciales inválidas');
  }

  login(user: AuthenticatedUser): LoginResponse {
    const payload: JwtPayload = {
      id: user.id,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      userName: user.userName,
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Devuelve el token de acceso, refresh token y los datos del usuario
    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async refresh(refreshToken: string): Promise<RefreshResponse> {
    try {
      // Verificar el refresh token
      const payload: JwtPayload = this.jwtService.verify(refreshToken);

      // Verificar que el usuario aún existe
      const user = await this.usersService.findByUsername(payload.userName);
      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      // Generar nuevos tokens
      const newPayload: JwtPayload = {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        userName: user.userName,
      };

      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: '15m',
      });
      const newRefreshToken = this.jwtService.sign(newPayload, {
        expiresIn: '7d',
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }
}
