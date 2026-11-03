import { Router } from 'express';
import {
  getDashboardSummary,
  getSalesChartData,
  exportSalesReportExcel,
} from '../controllers/report.controller';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/dashboard-summary', getDashboardSummary);
router.get('/charts', requirePermission('REPORTS_VIEW'), getSalesChartData);
router.get('/export/sales-excel', requirePermission('REPORTS_VIEW'), exportSalesReportExcel);

export default router;
