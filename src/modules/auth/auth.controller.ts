import {
  Controller,
  Get,
  Post,
  Res,
  BadRequestException,
  Headers,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

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
    const credentials = Buffer.from(base64Credentials, 'base64').toString(
      'ascii',
    );
    const [username, password] = credentials.split(':');

    try {
      const idToken = await this.authService.authenticate(username, password);

      // set http only cookie for 1h
      res.cookie('Authentication', idToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        path: '/',
        maxAge: 3600 * 1000,
      });

      return res.send({ message: 'Login successful' });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getMe(@Request() req: any, @Headers() headers: any, @Res() res: Response) {
    return res.send({ message: 'ok' });
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('Authentication', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      path: '/',
    });
    return res.send({ message: 'Logout successful' });
  }
}
