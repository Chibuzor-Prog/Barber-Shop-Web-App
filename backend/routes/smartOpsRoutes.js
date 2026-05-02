const express = require('express');
const router = express.Router();

const Service = require('../models/Service');
const Queue = require('../models/Queue');
const QueueEntry = require('../models/QueueEntry');

/**
 * Smart Queue Operations Advisor
 *
 * Original admin-focused smart feature package:
 * 1. Smart notification timing
 * 2. Stale/no-show queue detection
 * 3. Queue health recommendations
 *
 * This route does not modify or depend on the existing AI chatbot or translator files.
 */
router.get('/advisor', async (req, res) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ createdAt: 1 });

    const advisorResults = [];

    for (const service of services) {
      const queue = await Queue.findOne({
        serviceId: service._id,
        status: 'open',
      });

      if (!queue) {
        advisorResults.push({
          serviceId: service._id,
          serviceName: service.name,
          queueHealth: 'Normal',
          peopleWaiting: 0,
          estimatedTotalWait: 0,
          recommendation: 'No active queue pressure for this service.',
          notificationSuggestions: [],
          staleEntryWarnings: [],
        });
        continue;
      }

      const entries = await QueueEntry.find({
        queueId: queue._id,
        serviceId: service._id,
        status: { $in: ['waiting', 'almost ready'] },
      }).sort({ position: 1, joinTime: 1 });

      const serviceDuration = service.expectedDuration || service.duration || 15;
      const peopleWaiting = entries.length;
      const estimatedTotalWait = peopleWaiting * serviceDuration;

      let queueHealth = 'Normal';

      if (peopleWaiting >= 5 || estimatedTotalWait >= 90) {
        queueHealth = 'Critical';
      } else if (peopleWaiting >= 3 || estimatedTotalWait >= 45) {
        queueHealth = 'Busy';
      }

      const notificationSuggestions = entries.map((entry, index) => {
        const position = entry.position || index + 1;
        const estimatedWait = Math.max((position - 1) * serviceDuration, 0);
        const notifyInMinutes = Math.max(estimatedWait - 10, 0);

        return {
          ticketNumber: entry.ticketNumber,
          customerName: entry.userName,
          position,
          estimatedWait,
          notifyInMinutes,
          suggestion:
            notifyInMinutes === 0
              ? 'Notify now because this customer is close to being served.'
              : `Notify in approximately ${notifyInMinutes} minutes.`,
        };
      });

      const now = new Date();

      const staleEntryWarnings = entries
        .map((entry, index) => {
          const joinedAt = entry.joinTime || entry.createdAt;
          const position = entry.position || index + 1;

          if (!joinedAt) {
            return null;
          }

          const minutesWaiting = Math.floor((now - new Date(joinedAt)) / 60000);
          const expectedWait = Math.max((position - 1) * serviceDuration, 0);
          const staleThreshold = expectedWait + serviceDuration + 15;

          if (minutesWaiting > staleThreshold) {
            return {
              ticketNumber: entry.ticketNumber,
              customerName: entry.userName,
              minutesWaiting,
              expectedWait,
              warning:
                'This queue entry may be stale. Consider notifying, skipping, or removing this customer.',
            };
          }

          return null;
        })
        .filter(Boolean);

      let recommendation = 'Queue is operating normally.';

      if (queueHealth === 'Busy') {
        recommendation =
          'Queue is getting busy. Admin should monitor wait times and notify upcoming customers early.';
      }

      if (queueHealth === 'Critical') {
        recommendation =
          'Queue is overloaded. Consider assigning more staff, slowing new joins, or prioritizing shorter services.';
      }

      advisorResults.push({
        serviceId: service._id,
        serviceName: service.name,
        queueHealth,
        peopleWaiting,
        serviceDuration,
        estimatedTotalWait,
        recommendation,
        notificationSuggestions,
        staleEntryWarnings,
      });
    }

    return res.status(200).json({
      feature: 'Smart Queue Operations Advisor',
      description:
        'Admin-focused smart recommendations for notification timing, stale/no-show detection, and queue health.',
      generatedAt: new Date(),
      results: advisorResults,
    });
  } catch (error) {
    console.error('Smart Queue Operations Advisor error:', error);

    return res.status(500).json({
      message: 'Failed to generate smart queue operations recommendations.',
      error: error.message,
    });
  }
});

module.exports = router;