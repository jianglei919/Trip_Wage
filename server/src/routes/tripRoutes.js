import express from 'express';
import {
  createOrder,
  getUserOrders,
  getOrdersByDate,
  getOrdersByDateRange,
  getOrderById,
  updateOrder,
  deleteOrder,
  getDailyStats,
  saveWorkTime,
  getWorkTimeByDate,
  getHistoricalStats
} from '../controllers/tripController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Orders routes
router.route('/')
  .get(getUserOrders)
  .post(createOrder);

router.get('/date/:date', getOrdersByDate);
router.get('/range', getOrdersByDateRange);
router.get('/stats/:date', getDailyStats);
router.get('/historical-stats', getHistoricalStats);

router.route('/:id')
  .get(getOrderById)
  .put(updateOrder)
  .delete(deleteOrder);

// Work time routes
router.post('/worktime', saveWorkTime);
router.get('/worktime/:date', getWorkTimeByDate);

export default router;
