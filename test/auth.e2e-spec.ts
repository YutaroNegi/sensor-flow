import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authCookie: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('Should login successfully and receive cookie', async () => {
    const username = 'test-user';
    const password = 'test-1234';
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Authorization', `Basic ${credentials}`)
      .expect(200);

    authCookie = response.headers['set-cookie'][0];
    expect(authCookie).toContain('Authentication');
  });

  it('Should return 400 with the wrong credentials', async () => {
    const username = 'test-user';
    const password = 'wrong-password';
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');

    await request(app.getHttpServer())
      .post('/auth/login')
      .set('Authorization', `Basic ${credentials}`)
      .expect(400);
  });

  it('Should logout and clear the cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', authCookie)
      .expect(200);

    expect(response.body).toEqual({ message: 'Logout successful' });
    expect(response.headers['set-cookie'][0]).toContain('Authentication=;');
  });

  it('Should deny access to protected', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', authCookie)
      .expect(401);
  });
});
