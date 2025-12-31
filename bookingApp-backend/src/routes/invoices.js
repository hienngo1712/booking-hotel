import express from 'express';
import { verifyAdmin } from '../utils/verifyToken.js';
import { cancelInvoice, checkPaymentVnp, completeInvoice, countInvoice, createInvoice, deleteInvoice, getAllInvoice, getInvoiceById, getInvoiceByUser, paymentCredit, paymentVnpay, showInvoice, showInvoiceDetail } from '../controllers/invoiceController.js';

const router = express.Router();

// Tạo hóa đơn
router.post('/', createInvoice);
router.post('/payment/creadit', paymentCredit);
router.post('/payment/vnpay', paymentVnpay);

// chỉnh sửa hóa đơn chỉ áp dụng ở FE giao diện người dùng
router.put('/cancel/:invoiceId', cancelInvoice); // hủy hóa đơn/ hủy phòng
router.put('/complete/:id', completeInvoice) // hoàn thành
// xóa hóa đơn khỏi lịch sửa
router.delete('/:id', deleteInvoice);

router.get('/count', countInvoice); // đếm số lượng hóa đơn (ở FE admin)
router.get('/show', showInvoice);
router.get('/:userId', getInvoiceByUser);
router.get('/find/:id', getInvoiceById);
router.get('/detail/:id', showInvoiceDetail);
router.get('/', getAllInvoice);
router.get('/checkvnp/:id', checkPaymentVnp);



export default router