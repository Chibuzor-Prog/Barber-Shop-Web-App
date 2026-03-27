const request = require('supertest');
const app = require('../server');

describe('Authentication Module', () => {
  beforeEach(async () => {
    await request(app).post('/test/reset');
  });

  const testEmail = `test${Date.now()}@example.com`;

  test('should register a new user', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        name: 'Test User',
        email: testEmail,
        password: '123456'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('User registered');
    expect(res.body.user.email).toBe(testEmail);
  });

  test('should not register duplicate user', async () => {
    await request(app)
      .post('/auth/register')
      .send({
        name: 'Duplicate User',
        email: 'duplicate@example.com',
        password: '123456'
      });

    const res = await request(app)
      .post('/auth/register')
      .send({
        name: 'Duplicate User',
        email: 'duplicate@example.com',
        password: '123456'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('User already exists');
  });

  test('should login with valid credentials', async () => {
    await request(app)
      .post('/auth/register')
      .send({
        name: 'Login User',
        email: 'loginuser@example.com',
        password: '123456'
      });

    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'loginuser@example.com',
        password: '123456'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Login successful');
    expect(res.body.user.email).toBe('loginuser@example.com');
  });

  test('should reject invalid login', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'wrong@example.com',
        password: 'wrongpass'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });
});
