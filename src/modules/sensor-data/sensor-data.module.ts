import { Module } from '@nestjs/common';
import { SensorDataController } from './sensor-data.controller';
import { SensorDataService } from './sensor-data.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DynamoDB } from 'aws-sdk';

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
            connectTimeout: 5000,
            agent: new (require('https').Agent)({ maxSockets: 100 }),
          },
        });
      },
      inject: [ConfigService],
    },
  ],
})
export class SensorDataModule {}
