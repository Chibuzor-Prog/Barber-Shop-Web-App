'use strict';

/**
 * QueueSmart Backend – Comprehensive Unit Tests (A4 – MongoDB)
 *
 * FIX for "Exceeded timeout of 30000ms":
 * MongoMemoryServer downloads a real MongoDB binary on the FIRST run.
 * This can take 60-90 s on slow connections.
 * Solutions applied:
 * 1. testTimeout raised to 120 000 ms in package.json jest config.
 * 2. beforeAll() has its own explicit 120 000 ms timeout (5th arg).
 * 3. Validator unit tests are in a separate describe block that does NOT
 * depend on MongoDB at all — they run even if DB setup fails.
 * 4. MongoMemoryServer version pinned to 6.0.12 via package.json config
 * so the binary is cached after the first download.
 *
 * Run:  npm test
 */

process.env.NODE_ENV = 'test';

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request  = require('supertest');

// ── Validator tests run independently of MongoDB ──────────────────────────────
// Placed FIRST so they pass even if MongoMemoryServer times out.
const {
  isNonEmptyString,
  isPositiveNumber,
  isWithinLength,
  isValidPriority,
  isValidName,
} = require('../utils/validators');

describe('Validators – isNonEmptyString', () => {
  test('true for regular string',   () => expect(isNonEmptyString('hello')).toBe(true));
  test('false for empty string',    () => expect(isNonEmptyString('')).toBe(false));
  test('false for whitespace only', () => expect(isNonEmptyString('   ')).toBe(false));
  test('false for number',          () => expect(isNonEmptyString(42)).toBe(false));
  test('false for null',            () => expect(isNonEmptyString(null)).toBe(false));
  test('false for undefined',       () => expect(isNonEmptyString(undefined)).toBe(false));
});

describe('Validators – isPositiveNumber', () => {
  test('true for positive integer', () => expect(isPositiveNumber(5)).toBe(true));
  test('true for positive float',   () => expect(isPositiveNumber(0.5)).toBe(true));
  test('false for zero',            () => expect(isPositiveNumber(0)).toBe(false));
  test('false for negative',        () => expect(isPositiveNumber(-1)).toBe(false));
  test('false for string "5"',      () => expect(isPositiveNumber('5')).toBe(false));
  test('false for NaN',             () => expect(isPositiveNumber(NaN)).toBe(false));
  test('false for Infinity',        () => expect(isPositiveNumber(Infinity)).toBe(false));
});

describe('Validators – isWithinLength', () => {
  test('true at max length',    () => expect(isWithinLength('abc', 3)).toBe(true));
  test('true under max length', () => expect(isWithinLength('ab', 3)).toBe(true));
  test('false over max length', () => expect(isWithinLength('abcd', 3)).toBe(false));
  test('false for non-string',  () => expect(isWithinLength(123, 3)).toBe(false));
});

describe('Validators – isValidPriority', () => {
  test('accepts low',    () => expect(isValidPriority('low')).toBe(true));
  test('accepts medium', () => expect(isValidPriority('medium')).toBe(true));
  test('accepts high',   () => expect(isValidPriority('high')).toBe(true));
  test('rejects urgent', () => expect(isValidPriority('urgent')).toBe(false));
  test('rejects empty',  () => expect(isValidPriority('')).toBe(false));
  test('rejects null',   () => expect(isValidPriority(null)).toBe(false));
});

describe('Validators – isValidName', () => {
  test('true for valid name',        () => expect(isValidName('John', 100)).toBe(true));
  test('true at exactly max length', () => expect(isValidName('A'.repeat(100), 100)).toBe(true));
  test('false over max length',      () => expect(isValidName('A'.repeat(101), 100)).toBe(false));
  test('false for empty string',     () => expect(isValidName('', 100)).toBe(false));
  test('false for whitespace only',  () => expect(isValidName('   ', 100)).toBe(false));
});

// ── MongoDB-backed tests ──────────────────────────────────────────────────────

let mongod;
let app;

// Explicit 120s timeout on beforeAll — covers slow binary download
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGO_URI = uri;

  const { connectDB } = require('../db/connection');
  await connectDB(uri);

  app = require('../server');
}, 120000);

beforeEach(async () => {
  if (!app) return; // skip if setup failed
  const res = await request(app).post('/test/reset');
  expect(res.status).toBe(200);
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}, 30000);

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getJohnId() {
  const res = await request(app).post('/auth/login')
    .send({ email: 'john@example.com', password: '123456' });
  return res.body.user.id;
}

async function getAdminId() {
  const res = await request(app).post('/auth/login')
    .send({ email: 'admin@example.com', password: 'admin123' });
  return res.body.user.id;
}

async function getServiceId(index = 0) {
  const res = await request(app).get('/services');
  return res.body[index].id;
}

async function joinUser(userId, name, serviceIndex = 0) {
  const serviceId = await getServiceId(serviceIndex);
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
// TEST RESET
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /test/reset', () => {
  test('returns 200 and reset message', async () => {
    const res = await request(app).post('/test/reset');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset/i);
  });

  test('restores seeded services after a mutation', async () => {
    const svcId = await getServiceId(0);
    await request(app).put(`/services/${svcId}`).send({ name: 'Mutated Name' });
    await request(app).post('/test/reset');
    const newSvcId = await getServiceId(0);
    const res = await request(app).get(`/services/${newSvcId}`);
    expect(res.body.name).toBe('Haircut (Men)');
  });

  test('clears queue entries after joins', async () => {
    const uid = await getJohnId();
    await joinUser(uid, 'John');
    await request(app).post('/test/reset');
    const res = await request(app).get('/queue');
    expect(res.body).toEqual([]);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AUTH – REGISTER
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /auth/register', () => {
  test('registers a new user successfully', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'Alice Smith', email: 'alice@example.com', password: 'pass1234',
    });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ name: 'Alice Smith', email: 'alice@example.com', role: 'user' });
    expect(res.body.user.id).toBeDefined();
  });

  test('password is NOT returned in response', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'Bob', email: 'bob@test.com', password: 'secret99',
    });
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  test('returns 400 when name is missing', async () => {
    const res = await request(app).post('/auth/register').send({ email: 'x@x.com', password: 'pass1' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  test('returns 400 when email is missing', async () => {
    const res = await request(app).post('/auth/register').send({ name: 'X', password: 'pass1' });
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
    await request(app).post('/auth/register').send({ name: 'A', email: 'dup@x.com', password: 'pass1234' });
    const res = await request(app).post('/auth/register').send({ name: 'B', email: 'dup@x.com', password: 'pass5678' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  test('returns 400 for seeded email', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'Dup', email: 'john@example.com', password: 'pass1234',
    });
    expect(res.status).toBe(400);
  });

  test('role defaults to user', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'H', email: 'h@x.com', password: 'pass1234',
    });
    expect(res.body.user.role).toBe('user');
  });

  test('email is normalised to lowercase', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'Case', email: 'UPPER@CASE.COM', password: 'pass1234',
    });
    expect(res.body.user.email).toBe('upper@case.com');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AUTH – LOGIN
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /auth/login', () => {
  test('logs in seeded regular user', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'john@example.com', password: '123456' });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('user');
    expect(res.body.user.name).toBe('John Doe');
  });

  test('logs in seeded admin', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'admin@example.com', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('admin');
  });

  test('passwordHash not in response', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'john@example.com', password: '123456' });
    expect(res.body.user.passwordHash).toBeUndefined();
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

  test('returns 400 when password missing', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'john@example.com' });
    expect(res.status).toBe(400);
  });

  test('can log in with newly registered user', async () => {
    await request(app).post('/auth/register').send({ name: 'New', email: 'new@x.com', password: 'pass1234' });
    const res = await request(app).post('/auth/login').send({ email: 'new@x.com', password: 'pass1234' });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('new@x.com');
  });

  test('login is case-insensitive for email', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'JOHN@EXAMPLE.COM', password: '123456' });
    expect(res.status).toBe(200);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SERVICES – GET
// ═════════════════════════════════════════════════════════════════════════════
describe('GET /services', () => {
  test('returns seeded active services', async () => {
    const res = await request(app).get('/services');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
  });

  test('each service has id, name, description, expectedDuration, priorityLevel', async () => {
    const res = await request(app).get('/services');
    res.body.forEach(s => {
      expect(s).toHaveProperty('id');
      expect(s).toHaveProperty('name');
      expect(s).toHaveProperty('description');
      expect(s).toHaveProperty('expectedDuration');
      expect(s).toHaveProperty('priorityLevel');
    });
  });
});

describe('GET /services/:id', () => {
  test('returns a service by id', async () => {
    const svcId = await getServiceId(0);
    const res   = await request(app).get(`/services/${svcId}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Haircut (Men)');
  });

  test('returns 404 for unknown id', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res    = await request(app).get(`/services/${fakeId}`);
    expect(res.status).toBe(404);
  });

  test('returns 404 for invalid id format', async () => {
    const res = await request(app).get('/services/not-a-valid-id');
    expect(res.status).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SERVICES – CREATE
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /services', () => {
  test('creates a valid service', async () => {
    const res = await request(app).post('/services').send({
      name: 'Beard Trim', description: 'Quick trim', expectedDuration: 20, priorityLevel: 'low',
    });
    expect(res.status).toBe(201);
    expect(res.body.service).toMatchObject({ name: 'Beard Trim', expectedDuration: 20, priorityLevel: 'low' });
  });

  test('trims whitespace from name and description', async () => {
    const res = await request(app).post('/services').send({
      name: '  Trim  ', description: '  Desc  ', expectedDuration: 10, priorityLevel: 'medium',
    });
    expect(res.body.service.name).toBe('Trim');
    expect(res.body.service.description).toBe('Desc');
  });

  test('returns 400 when name is missing', async () => {
    const res = await request(app).post('/services').send({ description: 'D', expectedDuration: 10, priorityLevel: 'low' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when name is whitespace only', async () => {
    const res = await request(app).post('/services').send({ name: '   ', description: 'D', expectedDuration: 10, priorityLevel: 'low' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when name exceeds 100 chars', async () => {
    const res = await request(app).post('/services').send({
      name: 'A'.repeat(101), description: 'D', expectedDuration: 10, priorityLevel: 'medium',
    });
    expect(res.status).toBe(400);
  });

  test('returns 400 when description is missing', async () => {
    const res = await request(app).post('/services').send({ name: 'S', expectedDuration: 10, priorityLevel: 'low' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when description is empty', async () => {
    const res = await request(app).post('/services').send({ name: 'S', description: '', expectedDuration: 10, priorityLevel: 'low' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when expectedDuration is missing', async () => {
    const res = await request(app).post('/services').send({ name: 'S', description: 'D', priorityLevel: 'low' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when expectedDuration is zero', async () => {
    const res = await request(app).post('/services').send({ name: 'S', description: 'D', expectedDuration: 0, priorityLevel: 'low' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when expectedDuration is negative', async () => {
    const res = await request(app).post('/services').send({ name: 'S', description: 'D', expectedDuration: -5, priorityLevel: 'low' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when expectedDuration is a string', async () => {
    const res = await request(app).post('/services').send({ name: 'S', description: 'D', expectedDuration: 'thirty', priorityLevel: 'low' });
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid priorityLevel', async () => {
    const res = await request(app).post('/services').send({ name: 'S', description: 'D', expectedDuration: 10, priorityLevel: 'urgent' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when priorityLevel is missing', async () => {
    const res = await request(app).post('/services').send({ name: 'S', description: 'D', expectedDuration: 10 });
    expect(res.status).toBe(400);
  });

  test('accepts all three valid priorityLevels', async () => {
    for (const p of ['low', 'medium', 'high']) {
      const res = await request(app).post('/services').send({ name: `S-${p}`, description: 'D', expectedDuration: 10, priorityLevel: p });
      expect(res.status).toBe(201);
      expect(res.body.service.priorityLevel).toBe(p);
    }
  });

  test('new service appears in GET /services', async () => {
    await request(app).post('/services').send({ name: 'Extra', description: 'D', expectedDuration: 25, priorityLevel: 'high' });
    const res = await request(app).get('/services');
    expect(res.body.map(s => s.name)).toContain('Extra');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SERVICES – UPDATE
// ═════════════════════════════════════════════════════════════════════════════
describe('PUT /services/:id', () => {
  test('updates name', async () => {
    const svcId = await getServiceId(0);
    const res   = await request(app).put(`/services/${svcId}`).send({ name: "Men's Cut" });
    expect(res.status).toBe(200);
    expect(res.body.service.name).toBe("Men's Cut");
  });

  test('updates expectedDuration', async () => {
    const svcId = await getServiceId(0);
    const res   = await request(app).put(`/services/${svcId}`).send({ expectedDuration: 50 });
    expect(res.status).toBe(200);
    expect(res.body.service.expectedDuration).toBe(50);
  });

  test('updates priorityLevel', async () => {
    const svcId = await getServiceId(0);
    const res   = await request(app).put(`/services/${svcId}`).send({ priorityLevel: 'high' });
    expect(res.status).toBe(200);
    expect(res.body.service.priorityLevel).toBe('high');
  });

  test('returns 404 for unknown service', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res    = await request(app).put(`/services/${fakeId}`).send({ name: 'X' });
    expect(res.status).toBe(404);
  });

  test('returns 400 for empty name', async () => {
    const svcId = await getServiceId(0);
    const res   = await request(app).put(`/services/${svcId}`).send({ name: '' });
    expect(res.status).toBe(400);
  });

  test('returns 400 for zero expectedDuration', async () => {
    const svcId = await getServiceId(0);
    const res   = await request(app).put(`/services/${svcId}`).send({ expectedDuration: 0 });
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid priorityLevel', async () => {
    const svcId = await getServiceId(0);
    const res   = await request(app).put(`/services/${svcId}`).send({ priorityLevel: 'critical' });
    expect(res.status).toBe(400);
  });

  test('partial update preserves other fields', async () => {
    const svcId  = await getServiceId(0);
    const before = (await request(app).get(`/services/${svcId}`)).body;
    await request(app).put(`/services/${svcId}`).send({ name: 'NewName' });
    const after  = (await request(app).get(`/services/${svcId}`)).body;
    expect(after.description).toBe(before.description);
    expect(after.expectedDuration).toBe(before.expectedDuration);
    expect(after.priorityLevel).toBe(before.priorityLevel);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SERVICES – DELETE
// ═════════════════════════════════════════════════════════════════════════════
describe('DELETE /services/:id', () => {
  test('soft-deletes a service (removes from list)', async () => {
    const svcId = await getServiceId(3);
    const res   = await request(app).delete(`/services/${svcId}`);
    expect(res.status).toBe(200);
    const list  = await request(app).get('/services');
    expect(list.body.find(s => s.id === svcId)).toBeUndefined();
  });

  test('returns 404 for unknown service id', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res    = await request(app).delete(`/services/${fakeId}`);
    expect(res.status).toBe(404);
  });

  test('returns 404 for invalid id format', async () => {
    const res = await request(app).delete('/services/not-an-id');
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

  test('returns entries after joins', async () => {
    const uid = await getJohnId();
    await joinUser(uid, 'John', 0);
    const res = await request(app).get('/queue');
    expect(res.body.length).toBe(1);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE – JOIN
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /queue/join', () => {
  test('joins queue successfully', async () => {
    const uid = await getJohnId();
    const res = await joinUser(uid, 'John Doe', 0);
    expect(res.status).toBe(201);
    expect(res.body.entry).toMatchObject({ name: 'John Doe', status: 'waiting' });
    expect(res.body.entry.ticketNumber).toBe(1);
    expect(res.body.entry.id).toBeDefined();
  });

  test('returns 400 when userId is missing', async () => {
    const svcId = await getServiceId(0);
    const res   = await request(app).post('/queue/join').send({ name: 'X', serviceId: svcId });
    expect(res.status).toBe(400);
  });

  test('returns 400 when name is missing', async () => {
    const uid   = await getJohnId();
    const svcId = await getServiceId(0);
    const res   = await request(app).post('/queue/join').send({ userId: uid, serviceId: svcId });
    expect(res.status).toBe(400);
  });

  test('returns 400 when serviceId is missing', async () => {
    const uid = await getJohnId();
    const res = await request(app).post('/queue/join').send({ userId: uid, name: 'X' });
    expect(res.status).toBe(400);
  });

  test('returns 404 when serviceId does not exist', async () => {
    const uid    = await getJohnId();
    const fakeId = new mongoose.Types.ObjectId();
    const res    = await request(app).post('/queue/join').send({ userId: uid, name: 'John', serviceId: fakeId });
    expect(res.status).toBe(404);
  });

  test('returns 400 if user already in same service queue', async () => {
    const uid = await getJohnId();
    await joinUser(uid, 'John', 0);
    const res = await joinUser(uid, 'John', 0);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already/i);
  });

  test('allows same user to join different services', async () => {
    const uid = await getJohnId();
    await joinUser(uid, 'John', 0);
    const res = await joinUser(uid, 'John', 1);
    expect(res.status).toBe(201);
  });

  test('serviceName populated from service data', async () => {
    const uid = await getJohnId();
    const res = await joinUser(uid, 'John', 0);
    expect(res.body.entry.serviceName).toBe('Haircut (Men)');
  });

  test('creates a join notification', async () => {
    const uid = await getJohnId();
    await joinUser(uid, 'John', 0);
    const notifs = await request(app).get(`/notifications/user/${uid}`);
    expect(notifs.body[0].message).toMatch(/joined/i);
    expect(notifs.body[0].type).toBe('joined');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE – LEAVE
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /queue/leave', () => {
  test('removes a waiting user', async () => {
    const uid   = await getJohnId();
    const svcId = await getServiceId(0);
    await joinUser(uid, 'John', 0);
    const res = await request(app).post('/queue/leave').send({ userId: uid, serviceId: svcId });
    expect(res.status).toBe(200);
  });

  test('records Cancelled in history', async () => {
    const uid   = await getJohnId();
    const svcId = await getServiceId(0);
    await joinUser(uid, 'John', 0);
    await request(app).post('/queue/leave').send({ userId: uid, serviceId: svcId });
    const hist = await request(app).get(`/history/user/${uid}`);
    expect(hist.body.length).toBe(1);
    expect(hist.body[0].outcome).toBe('Cancelled');
    expect(hist.body[0].serviceName).toBe('Haircut (Men)');
  });

  test('returns 400 when userId is missing', async () => {
    const svcId = await getServiceId(0);
    const res   = await request(app).post('/queue/leave').send({ serviceId: svcId });
    expect(res.status).toBe(400);
  });

  test('returns 404 when user not in queue', async () => {
    const uid   = await getJohnId();
    const svcId = await getServiceId(0);
    const res   = await request(app).post('/queue/leave').send({ userId: uid, serviceId: svcId });
    expect(res.status).toBe(404);
  });

  test('creates a leave notification', async () => {
    const uid   = await getJohnId();
    const svcId = await getServiceId(0);
    await joinUser(uid, 'John', 0);
    await request(app).post('/queue/leave').send({ userId: uid, serviceId: svcId });
    const notifs = await request(app).get(`/notifications/user/${uid}`);
    expect(notifs.body.some(n => /left/i.test(n.message))).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE – LEAVE BY ID
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /queue/leave-by-id', () => {
  test('removes entry by id', async () => {
    const uid  = await getJohnId();
    const join = await joinUser(uid, 'John', 0);
    const res  = await request(app).post('/queue/leave-by-id').send({ entryId: join.body.entry.id });
    expect(res.status).toBe(200);
  });

  test('records Cancelled in history', async () => {
    const uid  = await getJohnId();
    const join = await joinUser(uid, 'John', 0);
    await request(app).post('/queue/leave-by-id').send({ entryId: join.body.entry.id });
    const hist = await request(app).get(`/history/user/${uid}`);
    expect(hist.body[0].outcome).toBe('Cancelled');
  });

  test('returns 400 when entryId missing', async () => {
    const res = await request(app).post('/queue/leave-by-id').send({});
    expect(res.status).toBe(400);
  });

  test('returns 404 for unknown entryId', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res    = await request(app).post('/queue/leave-by-id').send({ entryId: fakeId });
    expect(res.status).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE – SERVE NEXT
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /queue/serve-next', () => {
  test('marks first waiting user as served', async () => {
    const uid   = await getJohnId();
    const svcId = await getServiceId(0);
    await joinUser(uid, 'John', 0);
    const res = await request(app).post('/queue/serve-next').send({ serviceId: svcId });
    expect(res.status).toBe(200);
    expect(res.body.served.status).toBe('served');
  });

  test('serves in FIFO order', async () => {
    const svcId   = await getServiceId(0);
    const uid1    = await getJohnId();
    const adminId = await getAdminId();
    await request(app).post('/queue/join').send({ userId: uid1,    name: 'First',  serviceId: svcId });
    await request(app).post('/queue/join').send({ userId: adminId, name: 'Second', serviceId: svcId });
    const res = await request(app).post('/queue/serve-next').send({ serviceId: svcId });
    expect(res.body.served.name).toBe('First');
  });

  test('promotes next waiting person to almost ready', async () => {
    const svcId   = await getServiceId(0);
    const uid1    = await getJohnId();
    const adminId = await getAdminId();
    await request(app).post('/queue/join').send({ userId: uid1,    name: 'First',  serviceId: svcId });
    await request(app).post('/queue/join').send({ userId: adminId, name: 'Second', serviceId: svcId });
    await request(app).post('/queue/serve-next').send({ serviceId: svcId });
    const q      = (await request(app).get('/queue')).body;
    const second = q.find(e => e.name === 'Second');
    expect(second.status).toBe('almost ready');
  });

  test('no almost-ready when only one person', async () => {
    const uid   = await getJohnId();
    const svcId = await getServiceId(0);
    await joinUser(uid, 'Only', 0);
    await request(app).post('/queue/serve-next').send({ serviceId: svcId });
    const q = (await request(app).get('/queue')).body;
    expect(q.filter(e => e.status === 'almost ready').length).toBe(0);
  });

  test('records Served in history', async () => {
    const uid   = await getJohnId();
    const svcId = await getServiceId(0);
    await joinUser(uid, 'John', 0);
    await request(app).post('/queue/serve-next').send({ serviceId: svcId });
    const hist = await request(app).get(`/history/user/${uid}`);
    expect(hist.body[0].outcome).toBe('Served');
  });

  test('returns 400 when serviceId is missing', async () => {
    const res = await request(app).post('/queue/serve-next').send({});
    expect(res.status).toBe(400);
  });

  test('returns 400 when no one is waiting', async () => {
    const svcId = await getServiceId(0);
    const res   = await request(app).post('/queue/serve-next').send({ serviceId: svcId });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no waiting/i);
  });

  test('creates served and almost-ready notifications', async () => {
    const svcId   = await getServiceId(0);
    const uid1    = await getJohnId();
    const adminId = await getAdminId();
    await request(app).post('/queue/join').send({ userId: uid1,    name: 'A', serviceId: svcId });
    await request(app).post('/queue/join').send({ userId: adminId, name: 'B', serviceId: svcId });
    await request(app).post('/queue/serve-next').send({ serviceId: svcId });
    const n1 = await request(app).get(`/notifications/user/${uid1}`);
    const n2 = await request(app).get(`/notifications/user/${adminId}`);
    expect(n1.body.some(n => /served/i.test(n.message))).toBe(true);
    expect(n2.body.some(n => /almost ready/i.test(n.message))).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE – ADMIN REMOVE
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /queue/remove', () => {
  test('force-removes a user', async () => {
    const uid  = await getJohnId();
    const join = await joinUser(uid, 'John', 0);
    const res  = await request(app).post('/queue/remove').send({ entryId: join.body.entry.id });
    expect(res.status).toBe(200);
  });

  test('returns 400 when entryId is missing', async () => {
    const res = await request(app).post('/queue/remove').send({});
    expect(res.status).toBe(400);
  });

  test('returns 404 for unknown entryId', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res    = await request(app).post('/queue/remove').send({ entryId: fakeId });
    expect(res.status).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE – RESET
// ═════════════════════════════════════════════════════════════════════════════
describe('POST /queue/reset', () => {
  test('cancels all waiting entries', async () => {
    const uid = await getJohnId();
    await joinUser(uid, 'A', 0);
    const res = await request(app).post('/queue/reset');
    expect(res.status).toBe(200);
    const q = (await request(app).get('/queue')).body;
    expect(q.filter(e => e.status === 'waiting').length).toBe(0);
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
    const uid  = await getJohnId();
    const join = await joinUser(uid, 'John', 0);
    const res  = await request(app).get(`/queue/wait-time/${join.body.entry.id}`);
    expect(res.status).toBe(200);
    expect(res.body.estimatedWaitMinutes).toBe(0);
  });

  test('second person waits 1 × service expectedDuration', async () => {
    const svcId   = await getServiceId(0); // 30 min
    const uid1    = await getJohnId();
    const adminId = await getAdminId();
    await request(app).post('/queue/join').send({ userId: uid1,    name: 'A', serviceId: svcId });
    const r2 = await request(app).post('/queue/join').send({ userId: adminId, name: 'B', serviceId: svcId });
    const res = await request(app).get(`/queue/wait-time/${r2.body.entry.id}`);
    expect(res.body.estimatedWaitMinutes).toBe(30);
  });

  test('returns 404 for unknown entryId', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res    = await request(app).get(`/queue/wait-time/${fakeId}`);
    expect(res.status).toBe(404);
  });

  test('response includes entryId field', async () => {
    const uid  = await getJohnId();
    const join = await joinUser(uid, 'A', 0);
    const res  = await request(app).get(`/queue/wait-time/${join.body.entry.id}`);
    expect(res.body.entryId).toBeDefined();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// QUEUE – GET BY USER
// ═════════════════════════════════════════════════════════════════════════════
describe('GET /queue/user/:userId', () => {
  test('returns empty array for user with no entries', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res    = await request(app).get(`/queue/user/${fakeId}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns only entries for the specified user', async () => {
    const uid     = await getJohnId();
    const adminId = await getAdminId();
    await joinUser(uid,     'John',  0);
    await joinUser(adminId, 'Admin', 1);
    const res = await request(app).get(`/queue/user/${uid}`);
    expect(res.body.length).toBe(1);
  });

  test('includes estimatedWaitMinutes in each entry', async () => {
    const uid = await getJohnId();
    await joinUser(uid, 'John', 0);
    const res = await request(app).get(`/queue/user/${uid}`);
    expect(res.body[0]).toHaveProperty('estimatedWaitMinutes');
    expect(res.body[0].estimatedWaitMinutes).toBe(0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// HISTORY
// ═════════════════════════════════════════════════════════════════════════════
describe('GET /history', () => {
  test('returns empty array on fresh start', async () => {
    const res = await request(app).get('/history');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns all history entries across users', async () => {
    const uid   = await getJohnId();
    const svcId = await getServiceId(0);
    await joinUser(uid, 'John', 0);
    await request(app).post('/queue/leave').send({ userId: uid, serviceId: svcId });
    const res = await request(app).get('/history');
    expect(res.body.length).toBe(1);
  });
});

describe('GET /history/user/:userId', () => {
  test('returns empty array for user with no history', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res    = await request(app).get(`/history/user/${fakeId}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('records Cancelled when user leaves', async () => {
    const uid   = await getJohnId();
    const svcId = await getServiceId(0);
    await joinUser(uid, 'John', 0);
    await request(app).post('/queue/leave').send({ userId: uid, serviceId: svcId });
    const res = await request(app).get(`/history/user/${uid}`);
    expect(res.body[0].outcome).toBe('Cancelled');
    expect(res.body[0].serviceName).toBe('Haircut (Men)');
  });

  test('records Served when admin serves user', async () => {
    const uid   = await getJohnId();
    const svcId = await getServiceId(0);
    await joinUser(uid, 'John', 0);
    await request(app).post('/queue/serve-next').send({ serviceId: svcId });
    const res = await request(app).get(`/history/user/${uid}`);
    expect(res.body[0].outcome).toBe('Served');
  });

  test('records Cancelled for leave-by-id', async () => {
    const uid  = await getJohnId();
    const join = await joinUser(uid, 'John', 0);
    await request(app).post('/queue/leave-by-id').send({ entryId: join.body.entry.id });
    const res  = await request(app).get(`/history/user/${uid}`);
    expect(res.body[0].outcome).toBe('Cancelled');
  });

  test('history entry has a valid date field', async () => {
    const uid   = await getJohnId();
    const svcId = await getServiceId(0);
    await joinUser(uid, 'John', 0);
    await request(app).post('/queue/serve-next').send({ serviceId: svcId });
    const res = await request(app).get(`/history/user/${uid}`);
    expect(res.body[0].date).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  test('history entry includes joinedAt and completedAt timestamps', async () => {
    const uid   = await getJohnId();
    const svcId = await getServiceId(0);
    await joinUser(uid, 'John', 0);
    await request(app).post('/queue/serve-next').send({ serviceId: svcId });
    const res = await request(app).get(`/history/user/${uid}`);
    expect(res.body[0].joinedAt).toBeDefined();
    expect(res.body[0].completedAt).toBeDefined();
  });

  test('accumulates multiple entries for the same user', async () => {
    const uid    = await getJohnId();
    const svcId0 = await getServiceId(0);
    const svcId1 = await getServiceId(1);
    await joinUser(uid, 'John', 0);
    await request(app).post('/queue/leave').send({ userId: uid, serviceId: svcId0 });
    await joinUser(uid, 'John', 1);
    await request(app).post('/queue/serve-next').send({ serviceId: svcId1 });
    const res      = await request(app).get(`/history/user/${uid}`);
    expect(res.body.length).toBe(2);
    const outcomes = res.body.map(h => h.outcome);
    expect(outcomes).toContain('Cancelled');
    expect(outcomes).toContain('Served');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═════════════════════════════════════════════════════════════════════════════
describe('GET /notifications/user/:userId', () => {
  test('returns empty array for user with no notifications', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res    = await request(app).get(`/notifications/user/${fakeId}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('join notification includes service name and ticket number', async () => {
    const uid = await getJohnId();
    await joinUser(uid, 'John', 0);
    const res = await request(app).get(`/notifications/user/${uid}`);
    expect(res.body[0].message).toMatch(/Haircut \(Men\)/i);
    expect(res.body[0].message).toMatch(/#1/);
    expect(res.body[0].type).toBe('joined');
    expect(res.body[0].status).toBe('sent');
  });

  test('each notification has id, userId, message, type, status, createdAt', async () => {
    const uid = await getJohnId();
    await joinUser(uid, 'John', 0);
    const res = await request(app).get(`/notifications/user/${uid}`);
    const n   = res.body[0];
    ['id', 'userId', 'message', 'type', 'status', 'createdAt'].forEach(f =>
      expect(n).toHaveProperty(f)
    );
  });

  test('user A does not see user B notifications', async () => {
    const adminId = await getAdminId();
    await joinUser(adminId, 'Admin', 0);
    const uid = await getJohnId();
    const res = await request(app).get(`/notifications/user/${uid}`);
    expect(res.body.length).toBe(0);
  });
});

describe('PATCH /notifications/:id/viewed', () => {
  test('marks notification as viewed', async () => {
    const uid     = await getJohnId();
    await joinUser(uid, 'John', 0);
    const notifs  = await request(app).get(`/notifications/user/${uid}`);
    const notifId = notifs.body[0].id;
    const res     = await request(app).patch(`/notifications/${notifId}/viewed`);
    expect(res.status).toBe(200);
    const after   = await request(app).get(`/notifications/user/${uid}`);
    expect(after.body.find(n => n.id === notifId).status).toBe('viewed');
  });

  test('returns 404 for unknown notification id', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res    = await request(app).patch(`/notifications/${fakeId}/viewed`);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /notifications/:id', () => {
  test('dismisses a notification', async () => {
    const uid     = await getJohnId();
    await joinUser(uid, 'John', 0);
    const notifs  = await request(app).get(`/notifications/user/${uid}`);
    const notifId = notifs.body[0].id;
    const res     = await request(app).delete(`/notifications/${notifId}`);
    expect(res.status).toBe(200);
    const after   = await request(app).get(`/notifications/user/${uid}`);
    expect(after.body.find(n => n.id === notifId)).toBeUndefined();
  });

  test('returns 404 for unknown notification id', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res    = await request(app).delete(`/notifications/${fakeId}`);
    expect(res.status).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// INTEGRATION FLOWS
// ═════════════════════════════════════════════════════════════════════════════
describe('Integration – full user journey', () => {
  test('register → login → join → leave → history = Cancelled', async () => {
    await request(app).post('/auth/register').send({ name: 'Mary', email: 'mary@x.com', password: 'pass1234' });
    const login  = await request(app).post('/auth/login').send({ email: 'mary@x.com', password: 'pass1234' });
    const userId = login.body.user.id;
    const svcId  = await getServiceId(0);

    await request(app).post('/queue/join').send({ userId, name: 'Mary', serviceId: svcId });
    const q = await request(app).get(`/queue/user/${userId}`);
    expect(q.body[0].status).toBe('waiting');

    await request(app).post('/queue/leave').send({ userId, serviceId: svcId });
    const hist = await request(app).get(`/history/user/${userId}`);
    expect(hist.body[0].outcome).toBe('Cancelled');
  });

  test('admin serves → history Served + next gets almost-ready notification', async () => {
    const svcId   = await getServiceId(0);
    const uid1    = await getJohnId();
    const adminId = await getAdminId();
    await request(app).post('/queue/join').send({ userId: uid1,    name: 'First',  serviceId: svcId });
    await request(app).post('/queue/join').send({ userId: adminId, name: 'Second', serviceId: svcId });
    await request(app).post('/queue/serve-next').send({ serviceId: svcId });

    const hist   = await request(app).get(`/history/user/${uid1}`);
    expect(hist.body[0].outcome).toBe('Served');

    const notifs = await request(app).get(`/notifications/user/${adminId}`);
    expect(notifs.body.some(n => /almost ready/i.test(n.message))).toBe(true);
  });

  test('admin creates service then user joins it', async () => {
    const svc   = await request(app).post('/services').send({
      name: 'Hot Towel Shave', description: 'Luxury shave', expectedDuration: 35, priorityLevel: 'high',
    });
    const svcId = svc.body.service.id;
    const uid   = await getJohnId();
    const res   = await request(app).post('/queue/join').send({ userId: uid, name: 'John', serviceId: svcId });
    expect(res.status).toBe(201);
    expect(res.body.entry.serviceName).toBe('Hot Towel Shave');
  });

  test('admin deletes service then join attempt returns 404', async () => {
    const svcId = await getServiceId(3);
    await request(app).delete(`/services/${svcId}`);
    const uid = await getJohnId();
    const res = await request(app).post('/queue/join').send({ userId: uid, name: 'John', serviceId: svcId });
    expect(res.status).toBe(404);
  });

  test('multiple users in different services are fully isolated', async () => {
    const svcId0  = await getServiceId(0);
    const svcId1  = await getServiceId(1);
    const uid1    = await getJohnId();
    const adminId = await getAdminId();
    await request(app).post('/queue/join').send({ userId: uid1,    name: 'A', serviceId: svcId0 });
    await request(app).post('/queue/join').send({ userId: adminId, name: 'B', serviceId: svcId1 });
    await request(app).post('/queue/serve-next').send({ serviceId: svcId1 });

    const q1 = await request(app).get(`/queue/user/${uid1}`);
    const q2 = await request(app).get(`/queue/user/${adminId}`);
    expect(q1.body[0].status).toBe('waiting');
    expect(q2.body[0].status).toBe('served');
  });

  test('notification workflow: join → serve → almost-ready → viewed → dismiss', async () => {
    const svcId   = await getServiceId(0);
    const uid1    = await getJohnId();
    const adminId = await getAdminId();
    await request(app).post('/queue/join').send({ userId: uid1,    name: 'A', serviceId: svcId });
    await request(app).post('/queue/join').send({ userId: adminId, name: 'B', serviceId: svcId });
    await request(app).post('/queue/serve-next').send({ serviceId: svcId });

    const notifs  = await request(app).get(`/notifications/user/${adminId}`);
    const notifId = notifs.body.find(n => /almost ready/i.test(n.message))?.id;
    expect(notifId).toBeDefined();

    await request(app).patch(`/notifications/${notifId}/viewed`);
    const afterView = await request(app).get(`/notifications/user/${adminId}`);
    expect(afterView.body.find(n => n.id === notifId).status).toBe('viewed');

    await request(app).delete(`/notifications/${notifId}`);
    const afterDel = await request(app).get(`/notifications/user/${adminId}`);
    expect(afterDel.body.find(n => n.id === notifId)).toBeUndefined();
  });
});