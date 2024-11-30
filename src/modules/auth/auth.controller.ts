import { Controller, Get, Post, Res, BadRequestException, Headers, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Res() res: Response, @Headers() headers: any) {
    const authHeader = headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      throw new BadRequestException('Missing or invalid authorization header');
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    try {
      const idToken = await this.authService.authenticate(username, password);

      // set http only cookie for 1h
      res.cookie('Authentication', idToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 3600 * 1000,
      });

      return res.send({ message: 'Login successful' });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtStrategy)
  @Get('me')
  async getMe(@Res() res: Response, @Headers() headers: any) {
    const user = headers.user;
    return res.send({ user });
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('Authentication', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
    return res.send({ message: 'Logout successful' });
  }
}
