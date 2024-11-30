import { Test, TestingModule } from '@nestjs/testing';
import { SensorDataController } from './sensor-data.controller';
import { SensorDataService } from './sensor-data.service';
import { BadRequestException } from '@nestjs/common';

describe('SensorDataController', () => {
  let controller: SensorDataController;
  let service: SensorDataService;

  beforeEach(async () => {
    const mockSensorDataService = {
      createSensorData: jest.fn(),
      uploadCsvFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SensorDataController],
      providers: [
        {
          provide: SensorDataService,
          useValue: mockSensorDataService,
        },
      ],
    }).compile();

    controller = module.get<SensorDataController>(SensorDataController);
    service = module.get<SensorDataService>(SensorDataService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadCsv', () => {
    it('upload csv successfully', async () => {
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
      (service.uploadCsvFile as jest.Mock).mockResolvedValue(expectedResult);

      const result = await controller.uploadCsv(file);

      expect(service.uploadCsvFile).toHaveBeenCalledWith(file);
      expect(result).toEqual(expectedResult);
    });

    it('should raise error if the file is invalid', async () => {
      const file: any = null;

      await expect(controller.uploadCsv(file)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.uploadCsvFile).not.toHaveBeenCalled();
    });
  });
});
