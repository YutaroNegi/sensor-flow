import { Injectable, BadRequestException } from '@nestjs/common';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private cognito: CognitoIdentityServiceProvider;
  private clientId: string;
  private clientSecret: string;

  constructor(private configService: ConfigService) {
    this.cognito = new CognitoIdentityServiceProvider({
      region: this.configService.get<string>('AWS_REGION'),
    });
    this.clientId = this.configService.get<string>('COGNITO_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('COGNITO_CLIENT_SECRET');
  }

  async authenticate(username: string, password: string): Promise<string> {
    if (!username || !password || password.length < 8) {
      throw new BadRequestException('Invalid credentials');
    }

    const params = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: this.clientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
        SECRET_HASH: this.getSecretHash(username),
      },
    };

    try {
      const response = await this.cognito.initiateAuth(params).promise();
      return response.AuthenticationResult.IdToken;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  private getSecretHash(username: string): string {
    return crypto
      .createHmac('SHA256', this.clientSecret)
      .update(username + this.clientId)
      .digest('base64');
  }
}
