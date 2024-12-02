import { Controller, Get, Query, UseGuards, Param, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SensorAggregatedService } from './sensor-aggragated.service';
import { GetSensorAggregatedDto } from './dto/create-aggregated.dto';
import { CacheInterceptor } from '@nestjs/cache-manager';


@Controller('sensor-data-aggregated')
export class SensorAggragatedController {
  constructor(
    private readonly sensorAggregatedService: SensorAggregatedService,
  ) {}
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(CacheInterceptor)
  @Get()
  async create(@Query() query: GetSensorAggregatedDto) {
    return this.sensorAggregatedService.get(query);
  }
}
