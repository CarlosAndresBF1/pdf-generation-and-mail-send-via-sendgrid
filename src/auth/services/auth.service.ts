import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource } from '@nestjs/typeorm';
import { UsersService } from 'src/users/services/users.service';
import { DataSource } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    // Encuentra el usuario por nombre de usuario
    const user = await this.usersService.findByUsername(username);

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (await this.usersService.comparePassword(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }

    throw new UnauthorizedException('Credenciales inválidas');
  }

  async login(user: any): Promise<{ accessToken: string; user: any }> {
    const payload = {
      id: user.id,
      name: user.name,
      last_name: user.last_name,
      email: user.email,
      username: user.username,
    };
    const accessToken = this.jwtService.sign(payload);
    // Devuelve el token de acceso junto con los datos del usuario
    return {
      accessToken,
      user,
    };
  }
}
