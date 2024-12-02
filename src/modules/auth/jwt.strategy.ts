import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const headerToken = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
          if (headerToken) {
            return headerToken;
          }

          return request.cookies['Authentication'];
        },
      ]),
      ignoreExpiration: false,
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        jwksUri: process.env.COGNITO_AUTH_URI,
      }),
      algorithms: ['RS256'],
    } as StrategyOptions);
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
