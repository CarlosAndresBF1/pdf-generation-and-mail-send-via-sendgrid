import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key', // Define tu clave secreta
    });
  }

  async validate(payload: any) {
    // El payload contiene los datos del token JWT
    return {
      id: payload.id,
      name: payload.name,
      last_name: payload.last_name,
      email: payload.email,
      username: payload.username,
    };
  }
}
