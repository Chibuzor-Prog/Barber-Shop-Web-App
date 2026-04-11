const request = require('supertest');
const express = require('express');
const profileRoutes = require('../routes/profileRoutes');

jest.mock('../models/UserProfile');
jest.mock('../models/UserCredentials');

const UserProfile = require('../models/UserProfile');
const UserCredentials = require('../models/UserCredentials');

const app = express();
app.use(express.json());
app.use('/profile', profileRoutes);

describe('profileRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── GET: profile not found ─────────────────────────────────────────────
  test('GET /profile/:credentialId returns 404 when profile is not found', async () => {
    UserProfile.findOne.mockResolvedValue(null);

    const res = await request(app).get('/profile/123');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Profile not found');
  });

  // ── GET: success ───────────────────────────────────────────────────────
  test('GET /profile/:credentialId returns profile data', async () => {
    UserProfile.findOne.mockResolvedValue({
      _id: 'p1',
      credentialId: '123',
      email: 'test@example.com',
      fullName: 'Jonatan Rodriguez',
      phone: '7135551234',
      contactInfo: 'Houston',
      preferences: { notifications: true },
      updatedAt: '2026-04-10T00:00:00.000Z',
    });

    UserCredentials.findById.mockResolvedValue({ role: 'user' });

    const res = await request(app).get('/profile/123');

    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe('Jonatan Rodriguez');
    expect(res.body.role).toBe('user');
  });

  // ── PATCH: invalid fullName ─────────────────────────────────────────────
  test('PATCH /profile/:credentialId returns 400 for invalid fullName', async () => {
    UserProfile.findOne.mockResolvedValue({
      save: jest.fn(),
    });

    const res = await request(app)
      .patch('/profile/123')
      .send({ fullName: '' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Full name must be a non-empty string');
  });

  // ── PATCH: invalid phone ────────────────────────────────────────────────
  test('PATCH /profile/:credentialId returns 400 for invalid phone', async () => {
    UserProfile.findOne.mockResolvedValue({
      save: jest.fn(),
    });

    const res = await request(app)
      .patch('/profile/123')
      .send({ phone: 12345 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Phone must be a string');
  });

  // ── PATCH: invalid contactInfo ──────────────────────────────────────────
  test('PATCH /profile/:credentialId returns 400 for invalid contactInfo', async () => {
    UserProfile.findOne.mockResolvedValue({
      save: jest.fn(),
    });

    const res = await request(app)
      .patch('/profile/123')
      .send({ contactInfo: 12345 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Contact information must be a string');
  });

  // ── PATCH: success ──────────────────────────────────────────────────────
  test('PATCH /profile/:credentialId updates profile successfully', async () => {
    const mockSave = jest.fn();

    const mockProfile = {
      _id: 'p1',
      credentialId: '123',
      email: 'test@example.com',
      fullName: 'Old Name',
      phone: '',
      contactInfo: '',
      preferences: { notifications: true },
      updatedAt: '2026-04-10T00:00:00.000Z',
      save: mockSave,
    };

    UserProfile.findOne.mockResolvedValue(mockProfile);
    UserCredentials.findById.mockResolvedValue({ role: 'admin' });

    const res = await request(app)
      .patch('/profile/123')
      .send({
        fullName: 'New Name',
        phone: '7135551234',
        contactInfo: 'Houston',
        preferences: { language: 'en' },
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Profile updated');
    expect(res.body.profile.fullName).toBe('New Name');
    expect(res.body.profile.role).toBe('admin');
    expect(mockSave).toHaveBeenCalled();
  });
});