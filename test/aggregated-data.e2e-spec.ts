import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('SensorDataAggregatedController', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    const authUrl = process.env.COGNITO_TOKEN_URL;
    const grantType = process.env.COGNITO_GRANT_TYPE;

    const authResponse = await request(authUrl)
      .post('')
      .send(grantType)
      .set('Content-Type', 'application/x-www-form-urlencoded');

    if (authResponse.status !== 200) {
      throw new Error('Failed to authenticate with Cognito');
    }

    accessToken = authResponse.body.access_token;
  });
  it('Should retrieve sensor aggregated data 24h', async () => {
    const response = await request(app.getHttpServer())
      .get('/sensor-data-aggregated?interval=24h')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
  });

  it('Should retrieve sensor aggregated data 48h', async () => {
    const response = await request(app.getHttpServer())
      .get('/sensor-data-aggregated?interval=48h')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
  });

  it('Should retrieve sensor aggregated data 1w', async () => {
    const response = await request(app.getHttpServer())
      .get('/sensor-data-aggregated?interval=1w')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
  });

  it('Should retrieve sensor aggregated data 1m', async () => {
    const response = await request(app.getHttpServer())
      .get('/sensor-data-aggregated?interval=1m')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
  });

  it('Should return 400 if interval is invalid', async () => {
    const response = await request(app.getHttpServer())
      .get('/sensor-data-aggregated?interval=1y')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Invalid interval. Supported values are 24h, 48h, 1w, 1m');
  });
});
