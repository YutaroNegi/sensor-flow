import { SensorAggregatedService } from './sensor-aggragated.service';
import { ConfigService } from '@nestjs/config';
import { DynamoDB } from 'aws-sdk';

jest.mock('@nestjs/config');
jest.mock('aws-sdk');

describe('SensorAggregatedService', () => {
    let service: SensorAggregatedService;
    let configService: ConfigService;
    let dynamoDb: DynamoDB.DocumentClient;

    beforeEach(() => {
        configService = new ConfigService();
        dynamoDb = new DynamoDB.DocumentClient();

        (configService.get as jest.Mock).mockReturnValue('TestTable');

        service = new SensorAggregatedService(configService, dynamoDb);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});