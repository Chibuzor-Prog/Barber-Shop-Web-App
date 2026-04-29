// backend/tests/reportController.test.js
const { getUsersHistory, getServiceActivity, getQueueStats } = require('../controllers/reportController'); 
const User = require('../models/UserProfile');
const UserCredentials = require('../models/UserCredentials');
const QueueEntry = require('../models/QueueEntry');
const Service = require('../models/Service');
const History = require('../models/History');

jest.mock('../models/UserProfile');
jest.mock('../models/UserCredentials');
jest.mock('../models/QueueEntry');
jest.mock('../models/Service');
jest.mock('../models/History');
jest.mock('../models/Queue');

describe('Report Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {};
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getUsersHistory', () => {
    it('should return mapped user histories successfully', async () => {
      User.find.mockResolvedValue([{ _id: 'u1', credentialId: 'c1', fullName: 'John Doe', email: 'john@test.com', phone: '123' }]);
      UserCredentials.find.mockResolvedValue([{ _id: 'c1', role: 'admin' }]);
      History.find.mockResolvedValue([{ userId: 'c1', action: 'joined_queue' }]);

      await getUsersHistory(req, res);

      expect(res.json).toHaveBeenCalledWith([
        {
          user: { _id: 'u1', fullName: 'John Doe', email: 'john@test.com', phone: '123', role: 'admin' },
          history: [{ userId: 'c1', action: 'joined_queue' }]
        }
      ]);
    });

    it('should return role as user if no credentials match', async () => {
      User.find.mockResolvedValue([{ _id: 'u1', credentialId: 'c1', fullName: 'John Doe', email: 'john@test.com', phone: '123' }]);
      UserCredentials.find.mockResolvedValue([]); 
      History.find.mockResolvedValue([]);

      await getUsersHistory(req, res);

      expect(res.json).toHaveBeenCalledWith([
        {
          user: { _id: 'u1', fullName: 'John Doe', email: 'john@test.com', phone: '123', role: 'user' },
          history: []
        }
      ]);
    });

    it('should handle errors', async () => {
      User.find.mockRejectedValue(new Error('Database Error'));
      await getUsersHistory(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database Error' });
    });
  });

  describe('getServiceActivity', () => {
    it('should return mapped service activity successfully', async () => {
      Service.find.mockResolvedValue([{ _id: 's1', name: 'Haircut', description: 'Standard cut', expectedDuration: 30, priorityLevel: 1, isActive: true }]);
      QueueEntry.find.mockResolvedValue([{ serviceId: 's1', ticketNumber: 'A1' }]);

      await getServiceActivity(req, res);

      expect(res.json).toHaveBeenCalledWith([
        {
          service: { _id: 's1', name: 'Haircut', description: 'Standard cut', expectedDuration: 30, priorityLevel: 1, isActive: true },
          queueEntries: [{ serviceId: 's1', ticketNumber: 'A1' }]
        }
      ]);
    });

    it('should handle errors', async () => {
      Service.find.mockRejectedValue(new Error('Database Error'));
      await getServiceActivity(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database Error' });
    });
  });

  describe('getQueueStats', () => {
    it('should calculate queue stats and average wait time correctly', async () => {
      History.find.mockResolvedValue([{ waitTime: 10 }, { waitTime: 20 }]);

      await getQueueStats(req, res);

      expect(res.json).toHaveBeenCalledWith({ usersServed: 2, avgWaitTime: 15 });
    });

    it('should return 0 for average wait time if no wait times are available', async () => {
      History.find.mockResolvedValue([{ action: 'cancelled' }]); 

      await getQueueStats(req, res);

      expect(res.json).toHaveBeenCalledWith({ usersServed: 1, avgWaitTime: 0 });
    });

    it('should handle errors', async () => {
      History.find.mockRejectedValue(new Error('Database Error'));
      await getQueueStats(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database Error' });
    });
  });
});