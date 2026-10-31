import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import categoryRoutes from './category.routes';
import billingRoutes from './billing.routes';
import purchaseRoutes from './purchase.routes';
import supplierRoutes from './supplier.routes';
import customerRoutes from './customer.routes';
import stockRoutes from './stock.routes';
import reportRoutes from './report.routes';
import userRoutes from './user.routes';
import settingRoutes from './setting.routes';
import syncRoutes from './sync.routes';
import supportRoutes from './support.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/billing', billingRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/customers', customerRoutes);
router.use('/stock', stockRoutes);
router.use('/reports', reportRoutes);
router.use('/users', userRoutes);
router.use('/settings', settingRoutes);
router.use('/sync', syncRoutes);
router.use('/support', supportRoutes);

export default router;
