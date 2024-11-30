import { Test, TestingModule } from '@nestjs/testing';
import { SensorDataController } from './sensor-data.controller';
import { SensorDataService } from './sensor-data.service';

describe('SensorDataController', () => {
  let controller: SensorDataController;
  let service: SensorDataService;

  beforeEach(async () => {
    const mockSensorDataService = {
      createSensorData: jest.fn(),
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
});
