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

  it('should return correct average for valid interval "24h"', async () => {
    const mockItems = [
      { totalValue: 100, sampleCount: 10 },
      { totalValue: 200, sampleCount: 20 },
    ];

    (dynamoDb.query as jest.Mock).mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Items: mockItems,
        LastEvaluatedKey: null,
      }),
    });

    const result = await service.get({ interval: '24h' });

    expect(result.average).toBe(300 / 30);
    expect(result.totalCount).toBe(30);
    expect(result.items).toEqual(mockItems);
  });

  it('should throw an error for invalid interval', async () => {
    await expect(service.get({ interval: 'invalid' as any })).rejects.toThrow(
      'Invalid interval. Supported values are 24h, 48h, 1w, 1m',
    );
  });
});
