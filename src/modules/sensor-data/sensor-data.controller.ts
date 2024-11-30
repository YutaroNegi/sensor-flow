import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SensorDataService } from './sensor-data.service';
import { CreateSensorDataDto } from './dto/create-sensor-data.dto';

@Controller('sensor-data')
export class SensorDataController {
  constructor(private readonly sensorDataService: SensorDataService) {}
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() createSensorDataDto: CreateSensorDataDto) {
    return this.sensorDataService.createSensorData(createSensorDataDto);
  }
}
