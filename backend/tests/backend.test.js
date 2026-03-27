/**
 * QueueSmart Backend – Comprehensive Unit Tests
 * Target: 90 %+ line / branch coverage
 *
 * Install:  npm install --save-dev jest supertest
 * Run:      npx jest --coverage
 *
 * KEY DESIGN: A single app instance is created once.
 * Before every test, POST /test/reset calls store.reset() so each test
 * starts with clean, seed-only data — no require-cache tricks needed.
 */

'use strict';

process.env.NODE_ENV = 'test';

const request = require('supertest');
const app     = require('../server');

// ── Global reset before EVERY test ───────────────────────────────────────────
beforeEach(async () => {
  await request(app).post('/test/reset');
});

// ── Helpers ───────────────────────────────────────────────────────────────────
async function joinUser(userId, name, serviceId) {
  return request(app).post('/queue/join').send({ userId, name, serviceId });
}

// ═════════════════════════════════════════════════════════════════════════════
// ROOT
// ═════════════════════════════════════════════════════════════════════════════
describe('GET /', () => {
  test('returns 200 and running message', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/running/i);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TEST RESET ENDPOINT
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /test/reset', () => {
  test('returns 200 and reset message', async () => {
    const res = await request(app).post('/test/reset');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset/i);
  });

  test('restores seeded services after mutations', async () => {
    await request(app).put('/services/1').send({ name: 'Mutated' });
    await request(app).post('/test/reset');
    const res = await request(app).get('/services/1');
    expect(res.body.name).toBe('Haircut (Men)');
  });

  test('clears queue after joins', async () => {
    await joinUser(1, 'A', 1);
    await request(app).post('/test/reset');
    const res = await request(app).get('/queue');
    expect(res.body).toEqual([]);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AUTH – REGISTER
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /auth/register', () => {
  test('registers a new user with valid fields', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'Alice Smith', email: 'alice@example.com', password: 'secret',
    });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ name: 'Alice Smith', email: 'alice@example.com', role: 'user' });
    expect(res.body.user.id).toBeDefined();
  });

  test('assigns sequential id (seeded users are 1 & 2 → new user = 3)', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'Bob', email: 'bob@x.com', password: '123',
    });
    expect(res.body.user.id).toBe(3);
  });

  test('returns 400 when name is missing', async () => {
    const res = await request(app).post('/auth/register').send({ email: 'x@x.com', password: '1' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  test('returns 400 when email is missing', async () => {
    const res = await request(app).post('/auth/register').send({ name: 'X', password: '1' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when password is missing', async () => {
    const res = await request(app).post('/auth/register').send({ name: 'X', email: 'x@x.com' });
    expect(res.status).toBe(400);
  });

  test('returns 400 for empty body', async () => {
    const res = await request(app).post('/auth/register').send({});
    expect(res.status).toBe(400);
  });

  test('returns 400 for duplicate email', async () => {
    await request(app).post('/auth/register').send({ name: 'A', email: 'dup@x.com', password: '1' });
    const res = await request(app).post('/auth/register').send({ name: 'B', email: 'dup@x.com', password: '2' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test('returns 400 for seeded email john@example.com', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'Dup', email: 'john@example.com', password: 'abc',
    });
    expect(res.status).toBe(400);
  });

  test('role is always "user" for new registrations', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'H', email: 'h@x.com', password: '1',
    });
    expect(res.body.user.role).toBe('user');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AUTH – LOGIN
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /auth/login', () => {
  test('logs in seeded regular user', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'john@example.com', password: '123456' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/success/i);
    expect(res.body.user.role).toBe('user');
    expect(res.body.user.name).toBe('John Doe');
  });

  test('logs in seeded admin user', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'admin@example.com', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('admin');
  });

  test('returns 401 for wrong password', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'john@example.com', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid/i);
  });

  test('returns 401 for unknown email', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'nobody@x.com', password: '123' });
    expect(res.status).toBe(401);
  });

  test('returns 401 when both fields are wrong', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'fake@fake.com', password: 'fakepw' });
    expect(res.status).toBe(401);
  });

  test('can log in with a newly registered user', async () => {
    await request(app).post('/auth/register').send({ name: 'New', email: 'new@x.com', password: 'newpass' });
    const res = await request(app).post('/auth/login').send({ email: 'new@x.com', password: 'newpass' });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('new@x.com');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SERVICES – GET
// ═════════════════════════════════════════════════════════════════════════════
describe('GET /services', () => {
  test('returns 4 seeded services', async () => {
    const res = await request(app).get('/services');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(4);
  });

  test('each service has id, name, description, duration, priority', async () => {
    const res = await request(app).get('/services');
    res.body.forEach(s => {
      expect(s).toHaveProperty('id');
      expect(s).toHaveProperty('name');
      expect(s).toHaveProperty('description');
      expect(s).toHaveProperty('duration');
      expect(s).toHaveProperty('priority');
    });
  });
});

describe('GET /services/:id', () => {
  test('returns Haircut (Men) for id 1', async () => {
    const res = await request(app).get('/services/1');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Haircut (Men)');
  });

  test('returns 404 for unknown id', async () => {
    const res = await request(app).get('/services/999');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SERVICES – CREATE
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /services', () => {
  test('creates a valid service', async () => {
    const res = await request(app).post('/services').send({
      name: 'Beard Trim', description: 'Quick trim', duration: 20, priority: 'low',
    });
    expect(res.status).toBe(201);
    expect(res.body.service).toMatchObject({ name: 'Beard Trim', duration: 20, priority: 'low' });
    expect(res.body.service.id).toBeDefined();
  });

  test('trims whitespace from name and description', async () => {
    const res = await request(app).post('/services').send({
      name: '  Trim  ', description: '  Desc  ', duration: 10, priority: 'medium',
    });
    expect(res.body.service.name).toBe('Trim');
    expect(res.body.service.description).toBe('Desc');
  });

  test('returns 400 when name is missing', async () => {
    const res = await request(app).post('/services').send({ description: 'D', duration: 10, priority: 'low' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/name/i);
  });

  test('returns 400 when name is only whitespace', async () => {
    const res = await request(app).post('/services').send({ name: '   ', description: 'D', duration: 10, priority: 'low' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when name exceeds 100 chars', async () => {
    const res = await request(app).post('/services').send({
      name: 'A'.repeat(101), description: 'D', duration: 10, priority: 'medium',
    });
    expect(res.status).toBe(400);
  });

  test('returns 400 when description is missing', async () => {
    const res = await request(app).post('/services').send({ name: 'S', duration: 10, priority: 'low' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/description/i);
  });

  test('returns 400 when description is empty', async () => {
    const res = await request(app).post('/services').send({ name: 'S', description: '', duration: 10, priority: 'low' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when duration is missing', async () => {
    const res = await request(app).post('/services').send({ name: 'S', description: 'D', priority: 'low' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when duration is 0', async () => {
    const res = await request(app).post('/services').send({ name: 'S', description: 'D', duration: 0, priority: 'low' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when duration is negative', async () => {
    const res = await request(app).post('/services').send({ name: 'S', description: 'D', duration: -5, priority: 'low' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when duration is a string', async () => {
    const res = await request(app).post('/services').send({ name: 'S', description: 'D', duration: 'thirty', priority: 'low' });
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid priority', async () => {
    const res = await request(app).post('/services').send({ name: 'S', description: 'D', duration: 10, priority: 'urgent' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/priority/i);
  });

  test('returns 400 when priority is missing', async () => {
    const res = await request(app).post('/services').send({ name: 'S', description: 'D', duration: 10 });
    expect(res.status).toBe(400);
  });

  test('accepts all three valid priorities', async () => {
    for (const p of ['low', 'medium', 'high']) {
      const res = await request(app).post('/services').send({ name: `S-${p}`, description: 'D', duration: 10, priority: p });
      expect(res.status).toBe(201);
      expect(res.body.service.priority).toBe(p);
    }
  });

  test('new service appears in GET /services', async () => {
    await request(app).post('/services').send({ name: 'Extra', description: 'D', duration: 25, priority: 'high' });
    const res = await request(app).get('/services');
    expect(res.body.map(s => s.name)).toContain('Extra');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SERVICES – UPDATE
// ═════════════════════════════════════════════════════════════════════════════
describe('PUT /services/:id', () => {
  test('updates name', async () => {
    const res = await request(app).put('/services/1').send({ name: "Men's Cut" });
    expect(res.status).toBe(200);
    expect(res.body.service.name).toBe("Men's Cut");
  });

  test('updates description', async () => {
    const res = await request(app).put('/services/1').send({ description: 'Updated desc' });
    expect(res.status).toBe(200);
    expect(res.body.service.description).toBe('Updated desc');
  });

  test('updates duration', async () => {
    const res = await request(app).put('/services/1').send({ duration: 50 });
    expect(res.status).toBe(200);
    expect(res.body.service.duration).toBe(50);
  });

  test('updates priority', async () => {
    const res = await request(app).put('/services/1').send({ priority: 'high' });
    expect(res.status).toBe(200);
    expect(res.body.service.priority).toBe('high');
  });

  test('returns 404 for unknown service', async () => {
    const res = await request(app).put('/services/999').send({ name: 'X' });
    expect(res.status).toBe(404);
  });

  test('returns 400 for empty name', async () => {
    const res = await request(app).put('/services/1').send({ name: '' });
    expect(res.status).toBe(400);
  });

  test('returns 400 for name > 100 chars', async () => {
    const res = await request(app).put('/services/1').send({ name: 'B'.repeat(101) });
    expect(res.status).toBe(400);
  });

  test('returns 400 for empty description', async () => {
    const res = await request(app).put('/services/1').send({ description: '' });
    expect(res.status).toBe(400);
  });

  test('returns 400 for zero duration', async () => {
    const res = await request(app).put('/services/1').send({ duration: 0 });
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid priority', async () => {
    const res = await request(app).put('/services/1').send({ priority: 'critical' });
    expect(res.status).toBe(400);
  });

  test('partial update leaves other fields unchanged', async () => {
    const before = (await request(app).get('/services/1')).body;
    await request(app).put('/services/1').send({ name: 'NewName' });
    const after = (await request(app).get('/services/1')).body;
    expect(after.description).toBe(before.description);
    expect(after.duration).toBe(before.duration);
    expect(after.priority).toBe(before.priority);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SERVICES – DELETE
// ═════════════════════════════════════════════════════════════════════════════
describe('DELETE /services/:id', () => {
  test('deletes an existing service', async () => {
    const res = await request(app).delete('/services/4');
    expect(res.status).toBe(200);
    expect(res.body.service.id).toBe(4);
  });

  test('service is no longer in GET /services after delete', async () => {
    await request(app).delete('/services/4');
    const res = await request(app).get('/services');
    expect(res.body.find(s => s.id === 4)).toBeUndefined();
  });

  test('returns 404 for unknown service id', async () => {
    const res = await request(app).delete('/services/999');
    expect(res.status).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE – GET ALL
// ═════════════════════════════════════════════════════════════════════════════
describe('GET /queue', () => {
  test('returns empty array on fresh start', async () => {
    const res = await request(app).get('/queue');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns all entries after two joins', async () => {
    await joinUser(1, 'John', 1);
    await joinUser(2, 'Jane', 2);
    const res = await request(app).get('/queue');
    expect(res.body.length).toBe(2);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE – JOIN
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /queue/join', () => {
  test('joins successfully with valid data', async () => {
    const res = await joinUser(1, 'John Doe', 1);
    expect(res.status).toBe(201);
    expect(res.body.entry).toMatchObject({
      userId: 1, name: 'John Doe', serviceId: 1, status: 'waiting',
    });
    expect(res.body.entry.ticketNumber).toBe(1);
    expect(res.body.entry.id).toBeDefined();
    expect(res.body.entry.joinedAt).toBeDefined();
  });

  test('ticket numbers increment across services', async () => {
    const r1 = await joinUser(1, 'John', 1);
    const r2 = await joinUser(2, 'Jane', 2);
    expect(r2.body.entry.ticketNumber).toBe(r1.body.entry.ticketNumber + 1);
  });

  test('returns 400 when userId is missing', async () => {
    const res = await request(app).post('/queue/join').send({ name: 'X', serviceId: 1 });
    expect(res.status).toBe(400);
  });

  test('returns 400 when name is missing', async () => {
    const res = await request(app).post('/queue/join').send({ userId: 1, serviceId: 1 });
    expect(res.status).toBe(400);
  });

  test('returns 400 when serviceId is missing', async () => {
    const res = await request(app).post('/queue/join').send({ userId: 1, name: 'X' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when name is only whitespace', async () => {
    const res = await request(app).post('/queue/join').send({ userId: 1, name: '   ', serviceId: 1 });
    expect(res.status).toBe(400);
  });

  test('returns 400 when name exceeds 100 chars', async () => {
    const res = await request(app).post('/queue/join').send({ userId: 1, name: 'X'.repeat(101), serviceId: 1 });
    expect(res.status).toBe(400);
  });

  test('returns 404 when serviceId does not exist', async () => {
    const res = await joinUser(1, 'John', 999);
    expect(res.status).toBe(404);
  });

  test('returns 400 if same user already in same service queue', async () => {
    await joinUser(1, 'John', 1);
    const res = await joinUser(1, 'John', 1);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already/i);
  });

  test('allows same user to join different services', async () => {
    await joinUser(1, 'John', 1);
    const res = await joinUser(1, 'John', 2);
    expect(res.status).toBe(201);
  });

  test('allows different users to join the same service', async () => {
    await joinUser(1, 'John', 1);
    const res = await joinUser(2, 'Jane', 1);
    expect(res.status).toBe(201);
  });

  test('trims name whitespace', async () => {
    const res = await request(app).post('/queue/join').send({ userId: 1, name: '  John  ', serviceId: 1 });
    expect(res.body.entry.name).toBe('John');
  });

  test('serviceName is populated from service data', async () => {
    const res = await joinUser(1, 'John', 1);
    expect(res.body.entry.serviceName).toBe('Haircut (Men)');
  });

  test('re-join allowed after user was served', async () => {
    await joinUser(1, 'John', 1);
    await request(app).post('/queue/serve-next').send({ serviceId: 1 });
    const res = await joinUser(1, 'John', 1);
    expect(res.status).toBe(201);
  });

  test('creates a join notification', async () => {
    await joinUser(1, 'John', 1);
    const notifs = await request(app).get('/notifications/user/1');
    expect(notifs.body[0].message).toMatch(/joined/i);
    expect(notifs.body[0].message).toMatch(/#1/);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE – LEAVE
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /queue/leave', () => {
  test('removes a waiting user', async () => {
    await joinUser(1, 'John', 1);
    const res = await request(app).post('/queue/leave').send({ userId: 1, serviceId: 1 });
    expect(res.status).toBe(200);
    expect(res.body.removed.userId).toBe(1);
  });

  test('queue is empty after the only user leaves', async () => {
    await joinUser(1, 'John', 1);
    await request(app).post('/queue/leave').send({ userId: 1, serviceId: 1 });
    const q = await request(app).get('/queue');
    expect(q.body.length).toBe(0);
  });

  test('records Cancelled in history', async () => {
    await joinUser(1, 'John', 1);
    await request(app).post('/queue/leave').send({ userId: 1, serviceId: 1 });
    const hist = await request(app).get('/history/user/1');
    expect(hist.body.length).toBe(1);
    expect(hist.body[0].outcome).toBe('Cancelled');
    expect(hist.body[0].serviceName).toBe('Haircut (Men)');
  });

  test('returns 400 when userId is missing', async () => {
    const res = await request(app).post('/queue/leave').send({ serviceId: 1 });
    expect(res.status).toBe(400);
  });

  test('returns 400 when serviceId is missing', async () => {
    const res = await request(app).post('/queue/leave').send({ userId: 1 });
    expect(res.status).toBe(400);
  });

  test('returns 404 when user not in queue', async () => {
    const res = await request(app).post('/queue/leave').send({ userId: 99, serviceId: 1 });
    expect(res.status).toBe(404);
  });

  test('cannot leave a served entry', async () => {
    await joinUser(1, 'John', 1);
    await request(app).post('/queue/serve-next').send({ serviceId: 1 });
    const res = await request(app).post('/queue/leave').send({ userId: 1, serviceId: 1 });
    expect(res.status).toBe(404);
  });

  test('creates a leave notification', async () => {
    await joinUser(1, 'John', 1);
    await request(app).post('/queue/leave').send({ userId: 1, serviceId: 1 });
    const notifs = await request(app).get('/notifications/user/1');
    expect(notifs.body.some(n => /left/i.test(n.message))).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE – LEAVE BY ID
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /queue/leave-by-id', () => {
  test('removes entry by its id', async () => {
    const join = await joinUser(1, 'John', 1);
    const res  = await request(app).post('/queue/leave-by-id').send({ entryId: join.body.entry.id });
    expect(res.status).toBe(200);
    expect(res.body.removed.id).toBe(join.body.entry.id);
  });

  test('records Cancelled in history', async () => {
    const join = await joinUser(1, 'John', 1);
    await request(app).post('/queue/leave-by-id').send({ entryId: join.body.entry.id });
    const hist = await request(app).get('/history/user/1');
    expect(hist.body[0].outcome).toBe('Cancelled');
  });

  test('returns 400 when entryId is missing', async () => {
    const res = await request(app).post('/queue/leave-by-id').send({});
    expect(res.status).toBe(400);
  });

  test('returns 404 for unknown entryId', async () => {
    const res = await request(app).post('/queue/leave-by-id').send({ entryId: 99999999 });
    expect(res.status).toBe(404);
  });

  test('creates a cancellation notification', async () => {
    const join = await joinUser(1, 'John', 1);
    await request(app).post('/queue/leave-by-id').send({ entryId: join.body.entry.id });
    const notifs = await request(app).get('/notifications/user/1');
    expect(notifs.body.some(n => /cancelled/i.test(n.message))).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE – SERVE NEXT
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /queue/serve-next', () => {
  test('marks first waiting user as served', async () => {
    await joinUser(1, 'John', 1);
    const res = await request(app).post('/queue/serve-next').send({ serviceId: 1 });
    expect(res.status).toBe(200);
    expect(res.body.served.status).toBe('served');
    expect(res.body.served.userId).toBe(1);
  });

  test('serves in FIFO order', async () => {
    await joinUser(1, 'First', 1);
    await joinUser(2, 'Second', 1);
    const res = await request(app).post('/queue/serve-next').send({ serviceId: 1 });
    expect(res.body.served.name).toBe('First');
  });

  test('promotes next waiting person to almost ready', async () => {
    await joinUser(1, 'First',  1);
    await joinUser(2, 'Second', 1);
    await request(app).post('/queue/serve-next').send({ serviceId: 1 });
    const q      = (await request(app).get('/queue')).body;
    const second = q.find(e => e.userId === 2);
    expect(second.status).toBe('almost ready');
  });

  test('no almost-ready when only one person in queue', async () => {
    await joinUser(1, 'Only', 1);
    await request(app).post('/queue/serve-next').send({ serviceId: 1 });
    const q = (await request(app).get('/queue')).body;
    expect(q.filter(e => e.status === 'almost ready').length).toBe(0);
  });

  test('records Served in history', async () => {
    await joinUser(1, 'John', 1);
    await request(app).post('/queue/serve-next').send({ serviceId: 1 });
    const hist = await request(app).get('/history/user/1');
    expect(hist.body[0].outcome).toBe('Served');
  });

  test('returns 400 when serviceId is missing', async () => {
    const res = await request(app).post('/queue/serve-next').send({});
    expect(res.status).toBe(400);
  });

  test('returns 400 when no one is waiting', async () => {
    const res = await request(app).post('/queue/serve-next').send({ serviceId: 1 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no waiting/i);
  });

  test('skips almost-ready users — serves next waiting one', async () => {
    // A joins, B joins, C joins.  Serve A → B becomes almost ready.
    // Serve again → should find C (waiting), not B (almost ready).
    await joinUser(1, 'A', 1);
    await joinUser(2, 'B', 1);
    await joinUser(3, 'C', 1);
    await request(app).post('/queue/serve-next').send({ serviceId: 1 }); // serves A, B→almost ready
    const res2 = await request(app).post('/queue/serve-next').send({ serviceId: 1 });
    expect(res2.status).toBe(200);
    expect(res2.body.served.name).toBe('C');
  });

  test('creates served notification for served user', async () => {
    await joinUser(1, 'John', 1);
    await request(app).post('/queue/serve-next').send({ serviceId: 1 });
    const notifs = await request(app).get('/notifications/user/1');
    expect(notifs.body.some(n => /served/i.test(n.message))).toBe(true);
  });

  test('creates almost-ready notification for next person', async () => {
    await joinUser(1, 'A', 1);
    await joinUser(2, 'B', 1);
    await request(app).post('/queue/serve-next').send({ serviceId: 1 });
    const notifs = await request(app).get('/notifications/user/2');
    expect(notifs.body.some(n => /almost ready/i.test(n.message))).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE – ADMIN REMOVE
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /queue/remove', () => {
  test('force-removes a user by entryId', async () => {
    const join = await joinUser(1, 'John', 1);
    const res  = await request(app).post('/queue/remove').send({ entryId: join.body.entry.id });
    expect(res.status).toBe(200);
    expect(res.body.removed.userId).toBe(1);
  });

  test('queue is empty after remove', async () => {
    const join = await joinUser(1, 'John', 1);
    await request(app).post('/queue/remove').send({ entryId: join.body.entry.id });
    const q = (await request(app).get('/queue')).body;
    expect(q.length).toBe(0);
  });

  test('creates removal notification', async () => {
    const join = await joinUser(1, 'John', 1);
    await request(app).post('/queue/remove').send({ entryId: join.body.entry.id });
    const notifs = await request(app).get('/notifications/user/1');
    expect(notifs.body.some(n => /removed/i.test(n.message))).toBe(true);
  });

  test('returns 400 when entryId is missing', async () => {
    const res = await request(app).post('/queue/remove').send({});
    expect(res.status).toBe(400);
  });

  test('returns 404 for unknown entryId', async () => {
    const res = await request(app).post('/queue/remove').send({ entryId: 99999 });
    expect(res.status).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE – RESET
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /queue/reset', () => {
  test('clears all entries', async () => {
    await joinUser(1, 'A', 1);
    await joinUser(2, 'B', 2);
    const res = await request(app).post('/queue/reset');
    expect(res.status).toBe(200);
    expect((await request(app).get('/queue')).body.length).toBe(0);
  });

  test('reset on empty queue returns 200', async () => {
    const res = await request(app).post('/queue/reset');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset/i);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE – WAIT TIME
// ═════════════════════════════════════════════════════════════════════════════
describe('GET /queue/wait-time/:entryId', () => {
  test('first person has 0 wait time', async () => {
    const join = await joinUser(1, 'John', 1); // service 1 = 30 min
    const res  = await request(app).get(`/queue/wait-time/${join.body.entry.id}`);
    expect(res.status).toBe(200);
    expect(res.body.estimatedWaitMinutes).toBe(0);
  });

  test('second person waits 1 × duration (30 min)', async () => {
    await joinUser(1, 'A', 1);
    const join2 = await joinUser(2, 'B', 1);
    const res   = await request(app).get(`/queue/wait-time/${join2.body.entry.id}`);
    expect(res.body.estimatedWaitMinutes).toBe(30);
  });

  test('third person waits 2 × duration (60 min)', async () => {
    await joinUser(1, 'A', 1);
    await joinUser(2, 'B', 1);
    const join3 = await joinUser(3, 'C', 1);
    const res   = await request(app).get(`/queue/wait-time/${join3.body.entry.id}`);
    expect(res.body.estimatedWaitMinutes).toBe(60);
  });

  test('uses service-specific duration (service 3 = 20 min)', async () => {
    await joinUser(1, 'A', 3);
    const join2 = await joinUser(2, 'B', 3);
    const res   = await request(app).get(`/queue/wait-time/${join2.body.entry.id}`);
    expect(res.body.estimatedWaitMinutes).toBe(20);
  });

  test('returns 404 for unknown entryId', async () => {
    const res = await request(app).get('/queue/wait-time/99999');
    expect(res.status).toBe(404);
  });

  test('response includes entryId field', async () => {
    const join = await joinUser(1, 'A', 1);
    const res  = await request(app).get(`/queue/wait-time/${join.body.entry.id}`);
    expect(res.body.entryId).toBe(join.body.entry.id);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE – GET BY USER
// ═════════════════════════════════════════════════════════════════════════════
describe('GET /queue/user/:userId', () => {
  test('returns empty array for user with no entries', async () => {
    const res = await request(app).get('/queue/user/999');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns only entries for the specified user', async () => {
    await joinUser(1, 'John', 1);
    await joinUser(2, 'Jane', 2);
    const res = await request(app).get('/queue/user/1');
    expect(res.body.length).toBe(1);
    expect(res.body[0].userId).toBe(1);
  });

  test('includes estimatedWaitMinutes in each entry', async () => {
    await joinUser(1, 'John', 1);
    const res = await request(app).get('/queue/user/1');
    expect(res.body[0]).toHaveProperty('estimatedWaitMinutes');
    expect(res.body[0].estimatedWaitMinutes).toBe(0);
  });

  test('returns multiple entries when user joined multiple services', async () => {
    await joinUser(1, 'John', 1);
    await joinUser(1, 'John', 2);
    const res = await request(app).get('/queue/user/1');
    expect(res.body.length).toBe(2);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// HISTORY – ALL
// ═════════════════════════════════════════════════════════════════════════════
describe('GET /history', () => {
  test('returns empty array on fresh start', async () => {
    const res = await request(app).get('/history');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns all history entries across users', async () => {
    await joinUser(1, 'John', 1);
    await request(app).post('/queue/leave').send({ userId: 1, serviceId: 1 });
    await joinUser(2, 'Jane', 1);
    await request(app).post('/queue/serve-next').send({ serviceId: 1 });
    const res = await request(app).get('/history');
    expect(res.body.length).toBe(2);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// HISTORY – BY USER
// ═════════════════════════════════════════════════════════════════════════════
describe('GET /history/user/:userId', () => {
  test('returns empty array for user with no history', async () => {
    const res = await request(app).get('/history/user/999');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('records Cancelled when user leaves', async () => {
    await joinUser(1, 'John', 1);
    await request(app).post('/queue/leave').send({ userId: 1, serviceId: 1 });
    const res = await request(app).get('/history/user/1');
    expect(res.body.length).toBe(1);
    expect(res.body[0].outcome).toBe('Cancelled');
    expect(res.body[0].serviceName).toBe('Haircut (Men)');
  });

  test('records Served when admin serves user', async () => {
    await joinUser(1, 'John', 1);
    await request(app).post('/queue/serve-next').send({ serviceId: 1 });
    const res = await request(app).get('/history/user/1');
    expect(res.body[0].outcome).toBe('Served');
  });

  test('records Cancelled for leave-by-id', async () => {
    const join = await joinUser(1, 'John', 1);
    await request(app).post('/queue/leave-by-id').send({ entryId: join.body.entry.id });
    const res = await request(app).get('/history/user/1');
    expect(res.body[0].outcome).toBe('Cancelled');
  });

  test('accumulates multiple entries for the same user', async () => {
    await joinUser(1, 'John', 1);
    await request(app).post('/queue/leave').send({ userId: 1, serviceId: 1 });
    await joinUser(1, 'John', 2);
    await request(app).post('/queue/serve-next').send({ serviceId: 2 });
    const res = await request(app).get('/history/user/1');
    expect(res.body.length).toBe(2);
    const outcomes = res.body.map(h => h.outcome);
    expect(outcomes).toContain('Cancelled');
    expect(outcomes).toContain('Served');
  });

  test('history entry has a valid ISO date field', async () => {
    await joinUser(1, 'John', 1);
    await request(app).post('/queue/leave').send({ userId: 1, serviceId: 1 });
    const res = await request(app).get('/history/user/1');
    expect(res.body[0].date).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  test('only contains entries for the requested user', async () => {
    await joinUser(1, 'John', 1);
    await request(app).post('/queue/leave').send({ userId: 1, serviceId: 1 });
    await joinUser(2, 'Jane', 2);
    await request(app).post('/queue/leave').send({ userId: 2, serviceId: 2 });
    const res = await request(app).get('/history/user/1');
    expect(res.body.every(h => String(h.userId) === '1')).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS – GET BY USER
// ═════════════════════════════════════════════════════════════════════════════
describe('GET /notifications/user/:userId', () => {
  test('returns empty array for user with no notifications', async () => {
    const res = await request(app).get('/notifications/user/999');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('join notification includes service name and ticket number', async () => {
    await joinUser(1, 'John', 1);
    const res = await request(app).get('/notifications/user/1');
    expect(res.body[0].message).toMatch(/joined/i);
    expect(res.body[0].message).toMatch(/Haircut \(Men\)/i);
    expect(res.body[0].message).toMatch(/#1/);
  });

  test('creates served notification', async () => {
    await joinUser(1, 'John', 1);
    await request(app).post('/queue/serve-next').send({ serviceId: 1 });
    const res = await request(app).get('/notifications/user/1');
    expect(res.body.some(n => /served/i.test(n.message))).toBe(true);
  });

  test('creates leave notification', async () => {
    await joinUser(1, 'John', 1);
    await request(app).post('/queue/leave').send({ userId: 1, serviceId: 1 });
    const res = await request(app).get('/notifications/user/1');
    expect(res.body.some(n => /left/i.test(n.message))).toBe(true);
  });

  test('creates almost-ready notification for next in line', async () => {
    await joinUser(1, 'A', 1);
    await joinUser(2, 'B', 1);
    await request(app).post('/queue/serve-next').send({ serviceId: 1 });
    const res = await request(app).get('/notifications/user/2');
    expect(res.body.some(n => /almost ready/i.test(n.message))).toBe(true);
  });

  test('each notification has id, userId, message, createdAt', async () => {
    await joinUser(1, 'John', 1);
    const res = await request(app).get('/notifications/user/1');
    const n   = res.body[0];
    ['id', 'userId', 'message', 'createdAt'].forEach(f => expect(n).toHaveProperty(f));
  });

  test('user 1 does not see user 2 notifications', async () => {
    await joinUser(2, 'Jane', 1);
    const res = await request(app).get('/notifications/user/1');
    expect(res.body.length).toBe(0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS – DISMISS
// ═════════════════════════════════════════════════════════════════════════════
describe('DELETE /notifications/:id', () => {
  test('dismisses an existing notification', async () => {
    await joinUser(1, 'John', 1);
    const notifs  = await request(app).get('/notifications/user/1');
    const notifId = notifs.body[0].id;
    const res     = await request(app).delete(`/notifications/${notifId}`);
    expect(res.status).toBe(200);
    expect(res.body.removed.id).toBe(notifId);
  });

  test('dismissed notification absent in subsequent GET', async () => {
    await joinUser(1, 'John', 1);
    const notifs  = await request(app).get('/notifications/user/1');
    const notifId = notifs.body[0].id;
    await request(app).delete(`/notifications/${notifId}`);
    const after = await request(app).get('/notifications/user/1');
    expect(after.body.find(n => n.id === notifId)).toBeUndefined();
  });

  test('returns 404 for unknown notification id', async () => {
    const res = await request(app).delete('/notifications/99999');
    expect(res.status).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// VALIDATORS UNIT TESTS
// ═════════════════════════════════════════════════════════════════════════════
const {
  isNonEmptyString,
  isPositiveNumber,
  isWithinLength,
  isValidPriority,
  isValidName,
} = require('../utils/validators');

describe('Validators', () => {
  describe('isNonEmptyString', () => {
    test('returns true for a regular string', ()  => expect(isNonEmptyString('hello')).toBe(true));
    test('returns false for empty string',    ()  => expect(isNonEmptyString('')).toBe(false));
    test('returns false for whitespace-only', ()  => expect(isNonEmptyString('   ')).toBe(false));
    test('returns false for number',          ()  => expect(isNonEmptyString(42)).toBe(false));
    test('returns false for null',            ()  => expect(isNonEmptyString(null)).toBe(false));
    test('returns false for undefined',       ()  => expect(isNonEmptyString(undefined)).toBe(false));
  });

  describe('isPositiveNumber', () => {
    test('returns true for positive integer',  () => expect(isPositiveNumber(5)).toBe(true));
    test('returns true for positive float',    () => expect(isPositiveNumber(0.5)).toBe(true));
    test('returns false for zero',             () => expect(isPositiveNumber(0)).toBe(false));
    test('returns false for negative',         () => expect(isPositiveNumber(-1)).toBe(false));
    test('returns false for string "5"',       () => expect(isPositiveNumber('5')).toBe(false));
    test('returns false for NaN',              () => expect(isPositiveNumber(NaN)).toBe(false));
    test('returns false for Infinity',         () => expect(isPositiveNumber(Infinity)).toBe(false));
  });

  describe('isWithinLength', () => {
    test('returns true when at max length',    () => expect(isWithinLength('abc', 3)).toBe(true));
    test('returns true when under max length', () => expect(isWithinLength('ab', 3)).toBe(true));
    test('returns false when over max length', () => expect(isWithinLength('abcd', 3)).toBe(false));
    test('returns false for non-string',       () => expect(isWithinLength(123, 3)).toBe(false));
  });

  describe('isValidPriority', () => {
    test('accepts low',    () => expect(isValidPriority('low')).toBe(true));
    test('accepts medium', () => expect(isValidPriority('medium')).toBe(true));
    test('accepts high',   () => expect(isValidPriority('high')).toBe(true));
    test('rejects urgent', () => expect(isValidPriority('urgent')).toBe(false));
    test('rejects empty',  () => expect(isValidPriority('')).toBe(false));
    test('rejects null',   () => expect(isValidPriority(null)).toBe(false));
  });

  describe('isValidName', () => {
    test('returns true for valid name under limit', () => expect(isValidName('John', 100)).toBe(true));
    test('returns true at exactly max length',      () => expect(isValidName('A'.repeat(100), 100)).toBe(true));
    test('returns false when over max length',      () => expect(isValidName('A'.repeat(101), 100)).toBe(false));
    test('returns false for empty string',          () => expect(isValidName('', 100)).toBe(false));
    test('returns false for whitespace-only',       () => expect(isValidName('   ', 100)).toBe(false));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// INTEGRATION FLOWS
// ═════════════════════════════════════════════════════════════════════════════
describe('Integration – full user journey', () => {
  test('register → login → join → view → leave → history = Cancelled', async () => {
    await request(app).post('/auth/register').send({ name: 'Mary', email: 'mary@x.com', password: 'pw' });
    const login  = await request(app).post('/auth/login').send({ email: 'mary@x.com', password: 'pw' });
    const userId = login.body.user.id;

    await request(app).post('/queue/join').send({ userId, name: 'Mary', serviceId: 1 });
    const q = await request(app).get(`/queue/user/${userId}`);
    expect(q.body[0].status).toBe('waiting');

    await request(app).post('/queue/leave').send({ userId, serviceId: 1 });
    const hist = await request(app).get(`/history/user/${userId}`);
    expect(hist.body[0].outcome).toBe('Cancelled');
  });

  test('admin serves → history Served + next user gets almost-ready notification', async () => {
    await joinUser(10, 'First',  1);
    await joinUser(11, 'Second', 1);
    await request(app).post('/queue/serve-next').send({ serviceId: 1 });

    const hist   = await request(app).get('/history/user/10');
    expect(hist.body[0].outcome).toBe('Served');

    const notifs = await request(app).get('/notifications/user/11');
    expect(notifs.body.some(n => /almost ready/i.test(n.message))).toBe(true);
  });

  test('admin reset clears queue but history is preserved', async () => {
    await joinUser(1, 'A', 1);
    await request(app).post('/queue/serve-next').send({ serviceId: 1 });
    await joinUser(2, 'B', 1);
    await request(app).post('/queue/reset');

    expect((await request(app).get('/queue')).body.length).toBe(0);
    expect((await request(app).get('/history')).body.length).toBe(1);
  });

  test('multiple users in different services are fully isolated', async () => {
    await joinUser(1, 'A', 1);
    await joinUser(2, 'B', 2);
    await joinUser(3, 'C', 3);
    await request(app).post('/queue/serve-next').send({ serviceId: 2 });

    expect((await request(app).get('/queue/user/1')).body[0].status).toBe('waiting');
    expect((await request(app).get('/queue/user/2')).body[0].status).toBe('served');
    expect((await request(app).get('/queue/user/3')).body[0].status).toBe('waiting');
  });

  test('leave-by-id → history Cancelled + notification', async () => {
    const join   = await joinUser(5, 'Tom', 2);
    await request(app).post('/queue/leave-by-id').send({ entryId: join.body.entry.id });

    const hist   = await request(app).get('/history/user/5');
    expect(hist.body[0].outcome).toBe('Cancelled');

    const notifs = await request(app).get('/notifications/user/5');
    expect(notifs.body.some(n => /cancelled/i.test(n.message))).toBe(true);
  });

  test('wait time correct across 3 people (service 1 = 30 min)', async () => {
    const r1 = await joinUser(1, 'A', 1);
    const r2 = await joinUser(2, 'B', 1);
    const r3 = await joinUser(3, 'C', 1);

    expect((await request(app).get(`/queue/wait-time/${r1.body.entry.id}`)).body.estimatedWaitMinutes).toBe(0);
    expect((await request(app).get(`/queue/wait-time/${r2.body.entry.id}`)).body.estimatedWaitMinutes).toBe(30);
    expect((await request(app).get(`/queue/wait-time/${r3.body.entry.id}`)).body.estimatedWaitMinutes).toBe(60);
  });

  test('admin creates a new service then user can join it', async () => {
    const svc       = await request(app).post('/services').send({ name: 'Kids Cut', description: "Kids' cut", duration: 25, priority: 'low' });
    const newSvcId  = svc.body.service.id;
    const res       = await joinUser(1, 'John', newSvcId);
    expect(res.status).toBe(201);
    expect(res.body.entry.serviceName).toBe('Kids Cut');
  });

  test('admin deletes service then join attempt returns 404', async () => {
    await request(app).delete('/services/4');
    const res = await joinUser(1, 'John', 4);
    expect(res.status).toBe(404);
  });
});