import { Test, TestingModule } from '@nestjs/testing';
import { SensorDataService } from './sensor-data.service';
import { ConfigService } from '@nestjs/config';
import { DynamoDB } from 'aws-sdk';
import { CreateSensorDataDto } from './dto/create-sensor-data.dto';

describe('SensorDataService', () => {
  let service: SensorDataService;
  let dynamoDbMock: jest.Mocked<DynamoDB.DocumentClient>;

  beforeEach(async () => {
    dynamoDbMock = {
      put: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SensorDataService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                AWS_REGION: 'us-east-1',
                DYNAMODB_TABLE_NAME: 'SensorDataTable',
              };
              return config[key];
            }),
          },
        },
        {
          provide: 'DynamoDBDocumentClient',
          useValue: dynamoDbMock,
        },
      ],
    }).compile();

    service = module.get<SensorDataService>(SensorDataService);
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  describe('createSensorData', () => {
    it('should save sensor data sucessufully', async () => {
      const dto: CreateSensorDataDto = {
        equipmentId: 'EQ-12495',
        timestamp: '2023-02-15T01:30:00.000-05:00',
        value: 78.42,
      };

      dynamoDbMock.put.mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      } as any);

      const result = await service.createSensorData(dto);

      expect(dynamoDbMock.put).toHaveBeenCalledWith({
        TableName: 'SensorDataTable',
        Item: {
          equipmentId: dto.equipmentId,
          timestamp: dto.timestamp,
          value: dto.value,
          register_time: expect.any(String),
        },
      });
      expect(result).toEqual({ message: 'Data saved successfully' });
    });

    it('Should throw an error when DB fails', async () => {
      const dto: CreateSensorDataDto = {
        equipmentId: 'EQ-12495',
        timestamp: '2023-02-15T01:30:00.000-05:00',
        value: 78.42,
      };

      dynamoDbMock.put.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('DynamoDB Error')),
      } as any);

      await expect(service.createSensorData(dto)).rejects.toThrow(
        'Error saving data to DynamoDB: DynamoDB Error',
      );
      expect(dynamoDbMock.put).toHaveBeenCalledWith({
        TableName: 'SensorDataTable',
        Item: {
          equipmentId: dto.equipmentId,
          timestamp: dto.timestamp,
          value: dto.value,
          register_time: expect.any(String),
        },
      });
    });
  });
});
