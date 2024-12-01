import { IsString, IsISO8601, IsNumber } from 'class-validator';
import { IsOptional } from 'class-validator';

export class GetSensorAggregatedDto {
  @IsString()
  interval?: '24h' | '48h' | '1w' | '1m';
}
