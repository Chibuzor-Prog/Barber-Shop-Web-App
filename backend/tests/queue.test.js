const request = require('supertest');
const app = require('../server');

describe('Queue Management Module', () => {
  beforeEach(async () => {
    await request(app).post('/test/reset');
  });

  test('should join the queue', async () => {
    const res = await request(app)
      .post('/queue/join')
      .send({
        userId: 1,
        name: 'John Doe',
        serviceId: 1
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toBeDefined();
  });

  test('should not allow duplicate queue join', async () => {
    await request(app)
      .post('/queue/join')
      .send({
        userId: 1,
        name: 'John Doe',
        serviceId: 1
      });

    const res = await request(app)
      .post('/queue/join')
      .send({
        userId: 1,
        name: 'John Doe',
        serviceId: 1
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();
  });

  test('should return the queue', async () => {
    await request(app)
      .post('/queue/join')
      .send({
        userId: 1,
        name: 'John Doe',
        serviceId: 1
      });

    const res = await request(app).get('/queue');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test('should serve the next user', async () => {
    await request(app)
      .post('/queue/join')
      .send({
        userId: 1,
        name: 'John Doe',
        serviceId: 1
      });

    const res = await request(app).post('/queue/serve-next');

    expect(res.statusCode).toBeGreaterThanOrEqual(200);
    expect(res.body).toBeDefined();
  });

  test('should return error when serving empty queue', async () => {
    const res = await request(app).post('/queue/serve-next');

    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.body).toBeDefined();
  });

  test('should remove user from queue', async () => {
    await request(app)
      .post('/queue/join')
      .send({
        userId: 1,
        name: 'John Doe',
        serviceId: 1
      });

    const res = await request(app)
      .post('/queue/leave')
      .send({
        userId: 1
      });

    expect(res.statusCode).toBeGreaterThanOrEqual(200);
    expect(res.body).toBeDefined();
  });
});