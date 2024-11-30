import { IsString, IsISO8601, IsNumber } from 'class-validator';

export class CreateSensorDataDto {
  @IsString()
  equipmentId: string;

  @IsISO8601()
  timestamp: string;

  @IsNumber()
  value: number;
}
