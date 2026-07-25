const db = require('../config/db');

// Xử lý khi kho nhận được hàng hoàn & quay video kiểm tra
exports.inspectReturn = async (req, res) => {
    try {
        const returnId = req.params.id;
        const { return_status, restock_inventory } = req.body;
        const videoUrl = req.file ? `/uploads/${req.file.filename}` : null;

        // 1. Cập nhật trạng thái kiểm hàng & lưu đường dẫn video
        await db.query(
            'UPDATE order_returns SET return_status = ?, video_proof_url = ? WHERE id = ?',
            [return_status, videoUrl, returnId]
        );

        // 2. Nếu hàng nguyên vẹn -> Tự động cộng lại số lượng vào Kho
        if (return_status === 'inspected_ok' && restock_inventory) {
            await db.query(`
                UPDATE products p
                JOIN order_items oi ON p.id = oi.product_id
                JOIN order_returns ord ON ord.order_id = oi.order_id
                SET p.stock_quantity = p.stock_quantity + oi.quantity
                WHERE ord.id = ?
            `, [returnId]);
        }

        res.json({ success: true, message: 'Đã cập nhật đơn hoàn và cộng lại kho!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};