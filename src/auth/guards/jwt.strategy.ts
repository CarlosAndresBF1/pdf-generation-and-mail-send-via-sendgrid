import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { JwtPayload, AuthenticatedUser } from '../interfaces/auth.interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key', // Define tu clave secreta
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    // El payload contiene los datos del token JWT
    return {
      id: payload.id,
      name: payload.name,
      lastName: payload.lastName,
      email: payload.email,
      userName: payload.userName,
    };
  }
}
