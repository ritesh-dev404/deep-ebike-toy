import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  exportProductsExcel,
} from '../controllers/product.controller';
import { authenticateToken, requireOwner } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllProducts);
router.get('/export/excel', exportProductsExcel);
router.get('/barcode/:barcode', getProductByBarcode);
router.get('/:id', getProductById);
router.post('/', requireOwner, createProduct);
router.put('/:id', requireOwner, updateProduct);
router.delete('/:id', requireOwner, deleteProduct);

export default router;
