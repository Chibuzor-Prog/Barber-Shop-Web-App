const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/authRoutes');

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

test('login missing fields returns 400', async () => {
  const res = await request(app).post('/auth/login').send({});
  expect(res.status).toBe(400);
});