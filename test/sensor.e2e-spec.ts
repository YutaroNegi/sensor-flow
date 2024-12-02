import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as path from 'path';

describe('SensorDataController (Integration)', () => {
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
  it('Should create sensor data', async () => {
    const payload = {
      equipmentId: 'EQ-12492',
      value: 42.5,
      timestamp: new Date().toISOString(),
    };

    const response = await request(app.getHttpServer())
      .post('/sensor-data')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      message: 'Data saved successfully',
    });
  });

  it('Should fail to create sensor data', async () => {
    const payload = {
      // equipmentId: 'EQ-12492',
      // value: 42.5,
      timestamp: new Date().toISOString(),
    };

    await request(app.getHttpServer())
      .post('/sensor-data')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)
      .expect(400);
  });

  it('Should upload a CSV file', async () => {
    const csvFilePath = path.join(__dirname, 'test-files', 'example.csv');
    const response = await request(app.getHttpServer())
      .post('/sensor-data/upload-csv')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', csvFilePath)
      .expect(201);

    expect(response.body).toMatchObject({
      message: 'File uploaded successfully',
    });
  });

  it('Should reject missing files', async () => {
    const response = await request(app.getHttpServer())
      .post('/sensor-data/upload-csv')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);

    expect(response.body.message).toEqual('CSV File is required');
  });

  it('Should reject non csv', async () => {
    const content = 'text';
    const fileName = 'test.txt';
    const response = await request(app.getHttpServer())
      .post('/sensor-data/upload-csv')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.from(content), fileName)
      .expect(400);

    expect(response.body.message).toEqual('Only CSV files are allowed');
  });
});
