const express = require('express');
const router = express.Router();
const returnController = require('../controllers/returnController');
const upload = require('../middlewares/uploadMiddleware');

// Route 1: Lấy danh sách đơn hoàn
router.get('/', returnController.getReturns);

// Route 2: Tiếp nhận yêu cầu hoàn mới từ Sàn
router.post('/create', returnController.createReturn);

// Route 3: Upload video bóc hàng & Cập nhật kiểm kho
router.put('/inspect/:id', upload.single('video_proof'), returnController.inspectReturn);

module.exports = router;