import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SensorAggregatedService } from './sensor-aggragated.service';
import { GetSensorAggregatedDto } from './dto/create-aggregated.dto';

@Controller('sensor-data-aggregated')
export class SensorAggragatedController {
  constructor(
    private readonly sensorAggregatedService: SensorAggregatedService,
  ) {}
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async create(@Query() query: GetSensorAggregatedDto) {
    return this.sensorAggregatedService.get(query);
  }
}
