import { Controller, Post, Body } from '@nestjs/common';
import { SensorDataService } from './sensor-data.service';
import { CreateSensorDataDto } from './dto/create-sensor-data.dto';

@Controller('sensor-data')
export class SensorDataController {
  constructor(private readonly sensorDataService: SensorDataService) {}

  @Post()
  async create(@Body() createSensorDataDto: CreateSensorDataDto) {
    return this.sensorDataService.createSensorData(createSensorDataDto);
  }
}