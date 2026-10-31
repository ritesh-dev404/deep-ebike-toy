import { Router } from 'express';
import {
  getDashboardSummary,
  getSalesChartData,
  exportSalesReportExcel,
} from '../controllers/report.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/dashboard-summary', getDashboardSummary);
router.get('/charts', getSalesChartData);
router.get('/export/sales-excel', exportSalesReportExcel);

export default router;
