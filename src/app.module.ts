import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { SensorDataModule } from './modules/sensor-data/sensor-data.module';
import { SensorAggregatedModule } from './modules/sensor-aggregated/sensor-aggregated.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    AuthModule,
    SensorDataModule,
    SensorAggregatedModule,
    HealthModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.register({ isGlobal: true }),
  ],
})
export class AppModule {}
