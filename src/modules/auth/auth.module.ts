import { Module } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [PassportModule],
  providers: [AuthService, JwtStrategy],
  exports: [PassportModule],
  controllers: [AuthController],
})
export class AuthModule {}
