import { Module } from '@nestjs/common';
import { SensorDataController } from './sensor-data.controller';
import { SensorDataService } from './sensor-data.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3, DynamoDB } from 'aws-sdk';
import * as https from 'https';

@Module({
  imports: [ConfigModule],
  controllers: [SensorDataController],
  providers: [
    SensorDataService,
    {
      provide: 'DynamoDBDocumentClient',
      useFactory: (configService: ConfigService) => {
        return new DynamoDB.DocumentClient({
          region: configService.get<string>('AWS_REGION'),
          maxRetries: 3,
          httpOptions: {
            timeout: 5000,
            agent: new https.Agent({ maxSockets: 100 }),
          },
        });
      },
      inject: [ConfigService],
    },
    {
      provide: 'S3Client',
      useFactory: (configService: ConfigService) => {
        return new S3({
          region: configService.get<string>('AWS_REGION'),
          credentials: {
            accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID'),
            secretAccessKey: configService.get<string>('AWS_SECRET_ACCESS_KEY'),
          },
        });
      },
      inject: [ConfigService],
    },
  ],

})
export class SensorDataModule {}
