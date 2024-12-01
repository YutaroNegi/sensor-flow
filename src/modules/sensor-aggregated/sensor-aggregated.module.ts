import { Module } from '@nestjs/common';
import { SensorAggragatedController } from './sensor-aggregated.controller';
import { SensorAggregatedService } from './sensor-aggragated.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DynamoDB } from 'aws-sdk';
import * as https from 'https';

@Module({
  imports: [ConfigModule],
  controllers: [SensorAggragatedController],
  providers: [
    SensorAggregatedService,
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
  ],
})
export class SensorAggregatedModule {}
