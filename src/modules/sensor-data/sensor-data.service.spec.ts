import { Test, TestingModule } from '@nestjs/testing';
import { SensorDataService } from './sensor-data.service';
import { ConfigService } from '@nestjs/config';
import { DynamoDB, S3 } from 'aws-sdk';
import { CreateSensorDataDto } from './dto/create-sensor-data.dto';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'unique-id'),
}));

describe('SensorDataService', () => {
  let service: SensorDataService;
  let dynamoDbMock: jest.Mocked<DynamoDB.DocumentClient>;
  let s3Mock: jest.Mocked<S3>;

  beforeEach(async () => {
    dynamoDbMock = {
      put: jest.fn(),
    } as any;

    s3Mock = {
      putObject: jest.fn(),
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
                S3_BUCKET_NAME: 'sensor-data-bucket',
                AWS_ACCESS_KEY_ID: 'test-access-key-id',
                AWS_SECRET_ACCESS_KEY: 'test-secret-access-key',
              };
              return config[key];
            }),
          },
        },
        {
          provide: 'DynamoDBDocumentClient',
          useValue: dynamoDbMock,
        },
        {
          provide: 'S3Client',
          useValue: s3Mock,
        },
      ],
    }).compile();

    service = module.get<SensorDataService>(SensorDataService);
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  describe('createSensorData', () => {
    it('should save sensor data successfully', async () => {
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
          id: 'unique-id',
          equipmentId: dto.equipmentId,
          timestamp: dto.timestamp,
          value: dto.value,
          register_time: expect.any(String),
        },
      });
      expect(result).toEqual({
        message: 'Data saved successfully',
        id: 'unique-id',
      });
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
          id: 'unique-id',
          equipmentId: dto.equipmentId,
          timestamp: dto.timestamp,
          value: dto.value,
          register_time: expect.any(String),
        },
      });
    });
  });

  describe('uploadCsvFile', () => {
    it('should upload a csv file successfully', async () => {
      // Arrange
      const file: any = {
        fieldname: 'file',
        originalname: 'data.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        buffer: Buffer.from(
          'equipmentId,timestamp,value\nEQ-12495,2023-02-15T01:30:00.000-05:00,78.42',
        ),
        size: 100,
      };
      const expectedResult = {
        message: 'File uploaded successfully',
        fileName: 'unique-id-data.csv',
      };
      s3Mock.putObject.mockReturnValue({
        promise: jest.fn().mockResolvedValue({}),
      } as any);

      // Act
      const result = await service.uploadCsvFile(file);

      // Assert
      expect(s3Mock.putObject).toHaveBeenCalledWith({
        Bucket: 'sensor-data-bucket',
        Key: 'unique-id-data.csv',
        Body: file.buffer,
        ContentType: 'text/csv',
      });
      expect(result).toEqual(expectedResult);
    });

    it('should return error when S3 fails ', async () => {
      // Arrange
      const file: any = {
        fieldname: 'file',
        originalname: 'data.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        buffer: Buffer.from(
          'equipmentId,timestamp,value\nEQ-12495,2023-02-15T01:30:00.000-05:00,78.42',
        ),
        size: 100,
      };

      s3Mock.putObject.mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('S3 Error')),
      } as any);

      // Act & Assert
      await expect(service.uploadCsvFile(file)).rejects.toThrow(
        'Error uploading file to S3: S3 Error',
      );
      expect(s3Mock.putObject).toHaveBeenCalledWith({
        Bucket: 'sensor-data-bucket',
        Key: 'unique-id-data.csv',
        Body: file.buffer,
        ContentType: 'text/csv',
      });
    });
  });
});
