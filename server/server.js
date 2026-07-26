// 1. Khai báo dotenv ở ĐẦU FILE
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

// 2. Đọc cấu hình từ process.env
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'oms_db'
};

// Hàm trợ giúp tạo kết nối Database
async function getConnection() {
  return await mysql.createConnection(dbConfig);
}

// Chạy server với PORT từ .env
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại port ${PORT}`);
});

// Hàm format ngày chuẩn YYYY-MM-DD theo local time
const formatDate = (dateVal) => {
  if (!dateVal) return '';
  if (typeof dateVal === 'string' && dateVal.includes('T')) {
    dateVal = dateVal.split('T')[0];
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// =========================================================================
// 1. API XÁC THỰC & ĐĂNG NHẬP (AUTHENTICATION) - MỚI BỔ SUNG
// =========================================================================

// POST: API Đăng nhập hệ thống
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu' });
  }

  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(
      'SELECT id, username, name FROM users WHERE username = ? AND password = ?',
      [username, password]
    );
    await conn.end();

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác!' });
    }

    const user = rows[0];
    res.json({
      message: 'Đăng nhập thành công',
      user: {
        id: user.id,
        username: user.username,
        name: user.name
      }
    });
  } catch (err) {
    console.error('Lỗi POST /api/login:', err);
    res.status(500).json({ error: 'Lỗi hệ thống khi kiểm tra tài khoản' });
  }
});

// =========================================================================
// 2. API DANH MỤC SẢN PHẨM (PRODUCTS)
// =========================================================================

// GET: Lấy danh sách sản phẩm
app.get('/api/products', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute('SELECT * FROM products ORDER BY id DESC');
    await conn.end();

    const formattedProducts = rows.map(p => ({
      id: p.id,
      name: p.name,
      price: Number(p.price || 0),
      createdAt: formatDate(p.created_at)
    }));

    res.json(formattedProducts);
  } catch (err) {
    console.error('Lỗi GET /api/products:', err);
    res.status(500).json({ error: 'Lỗi lấy danh sách sản phẩm' });
  }
});

// POST: Thêm sản phẩm mới
app.post('/api/products', async (req, res) => {
  const { name, price } = req.body;
  try {
    const conn = await getConnection();
    const [result] = await conn.execute(
      'INSERT INTO products (name, price) VALUES (?, ?)',
      [name, price || 0]
    );
    await conn.end();

    res.status(201).json({ message: 'Thêm sản phẩm thành công', id: result.insertId });
  } catch (err) {
    console.error('Lỗi POST /api/products:', err);
    res.status(500).json({ error: 'Không thể thêm sản phẩm' });
  }
});

// DELETE: Xóa sản phẩm
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const conn = await getConnection();
    await conn.execute('DELETE FROM products WHERE id = ?', [id]);
    await conn.end();

    res.json({ message: 'Xóa sản phẩm thành công' });
  } catch (err) {
    console.error(`Lỗi DELETE /api/products/${id}:`, err);
    res.status(500).json({ error: 'Xóa sản phẩm thất bại' });
  }
});

// =========================================================================
// 3. API ĐƠN HÀNG BÁN (ORDERS)
// =========================================================================

// GET: Lấy danh sách tất cả đơn hàng
app.get('/api/orders', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute('SELECT * FROM orders ORDER BY created_at DESC');
    await conn.end();

    const formattedOrders = rows.map(o => ({
      id: o.id,
      platform: o.platform,
      customer: o.customer,
      phone: o.phone,
      product: o.product,
      productId: o.product_id || null,
      productPrice: Number(o.product_price || 0),
      sellingPrice: Number(o.selling_price || 0),
      quantity: o.quantity,
      amount: Number(o.amount),
      status: o.status,
      createdDate: formatDate(o.created_date),
      deliveredDate: formatDate(o.delivered_date)
    }));

    res.json(formattedOrders);
  } catch (err) {
    console.error('Lỗi GET /api/orders:', err);
    res.status(500).json({ error: 'Lỗi kết nối CSDL phpMyAdmin' });
  }
});

// POST: Thêm đơn hàng mới
app.post('/api/orders', async (req, res) => {
  const { 
    id, platform, customer, phone, product, productId, productPrice, sellingPrice,
    quantity, amount, status, createdDate, deliveredDate 
  } = req.body;

  try {
    const conn = await getConnection();
    const sql = `
      INSERT INTO orders 
      (id, platform, customer, phone, product, product_id, product_price, selling_price, quantity, amount, status, created_date, delivered_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await conn.execute(sql, [
      id, 
      platform || 'Shopee', 
      customer || '', 
      phone || '', 
      product, 
      productId || null, 
      productPrice || 0, 
      sellingPrice || 0, 
      quantity || 1, 
      amount || 0, 
      status || 'Mới tạo', 
      createdDate || null, 
      deliveredDate || null
    ]);
    await conn.end();

    res.status(201).json({ message: 'Thêm đơn hàng thành công', id });
  } catch (err) {
    console.error('Lỗi POST /api/orders:', err);
    res.status(500).json({ error: 'Không thể thêm đơn hàng vào SQL' });
  }
});

// PUT: Cập nhật TOÀN BỘ thông tin đơn hàng
app.put('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    customer, 
    phone, 
    product, 
    quantity, 
    amount, 
    sellingPrice, 
    status, 
    createdDate, 
    deliveredDate 
  } = req.body;

  try {
    const conn = await getConnection();
    const sql = `
      UPDATE orders 
      SET customer = COALESCE(?, customer),
          phone = COALESCE(?, phone),
          product = COALESCE(?, product),
          quantity = COALESCE(?, quantity),
          amount = COALESCE(?, amount),
          selling_price = COALESCE(?, selling_price),
          status = COALESCE(?, status),
          created_date = COALESCE(?, created_date),
          delivered_date = COALESCE(?, delivered_date)
      WHERE id = ?
    `;

    await conn.execute(sql, [
      customer !== undefined ? customer : null,
      phone !== undefined ? phone : null,
      product !== undefined ? product : null,
      quantity !== undefined ? Number(quantity) : null,
      amount !== undefined ? Number(amount) : null,
      sellingPrice !== undefined ? Number(sellingPrice) : null,
      status !== undefined ? status : null,
      createdDate !== undefined ? createdDate : null,
      deliveredDate !== undefined ? deliveredDate : null,
      id
    ]);

    await conn.end();
    res.json({ message: 'Cập nhật đơn hàng thành công' });
  } catch (err) {
    console.error(`Lỗi PUT /api/orders/${id}:`, err);
    res.status(500).json({ error: 'Cập nhật dữ liệu thất bại' });
  }
});

// DELETE: Xóa một đơn hàng
app.delete('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const conn = await getConnection();
    await conn.execute('DELETE FROM orders WHERE id = ?', [id]);
    await conn.end();

    res.json({ message: 'Xóa đơn hàng thành công' });
  } catch (err) {
    console.error(`Lỗi DELETE /api/orders/${id}:`, err);
    res.status(500).json({ error: 'Xóa đơn hàng thất bại' });
  }
});

// =========================================================================
// 4. API ĐƠN HOÀN & BOM HÀNG (RETURNS)
// =========================================================================

// GET: Lấy danh sách tất cả đơn hoàn
app.get('/api/returns', async (req, res) => {
  try {
    const db = await getConnection();
    const [rows] = await db.execute('SELECT * FROM returns ORDER BY created_at DESC');
    await db.end();

    const formattedReturns = rows.map(r => ({
      id: r.id,
      returnCode: r.return_code || r.id,
      orderId: r.order_id,
      platform: r.platform,
      customer: r.customer,
      product: r.product,
      reason: r.reason,
      refundAmount: Number(r.refund_amount || 0),
      status: r.status,
      videoProof: r.video_proof || '',
      note: r.note || '',
      returnDate: formatDate(r.return_date),
      receivedDate: formatDate(r.receivedDate || r.received_date)
    }));

    res.json(formattedReturns);
  } catch (err) {
    console.error('Lỗi GET /api/returns:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST: Tạo đơn hoàn mới
app.post('/api/returns', async (req, res) => {
  const { id, returnCode, orderId, platform, customer, product, reason, refundAmount, status, note, returnDate } = req.body;
  try {
    const conn = await getConnection();
    const sql = `
      INSERT INTO \`returns\` (id, return_code, order_id, platform, customer, product, reason, refund_amount, status, note, return_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await conn.execute(sql, [
      id, 
      returnCode || id, 
      orderId, 
      platform, 
      customer || 'Khách hàng', 
      product, 
      reason, 
      refundAmount || 0, 
      status || 'PENDING', 
      note || '', 
      returnDate
    ]);
    await conn.end();

    res.status(201).json({ message: 'Tạo đơn hoàn thành công', id });
  } catch (err) {
    console.error('Lỗi POST /api/returns:', err);
    res.status(500).json({ error: 'Không thể chèn đơn hoàn vào SQL' });
  }
});

// PUT: Cập nhật Nhập kho & Lưu ngày
app.put('/api/returns/:id', async (req, res) => {
  const { id } = req.params;
  const { status, videoProof, receivedDate } = req.body;

  try {
    const db = await getConnection();

    const sql = `
      UPDATE returns 
      SET status = ?, 
          video_proof = ?, 
          receivedDate = ? 
      WHERE id = ? OR return_code = ?
    `;

    const [result] = await db.execute(sql, [
      status, 
      videoProof || '', 
      receivedDate || null, 
      id, 
      id
    ]);

    await db.end();

    res.json({ message: 'Cập nhật đơn hoàn thành công!', affectedRows: result.affectedRows });
  } catch (err) {
    console.error('Lỗi PUT /api/returns/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Xóa đơn hoàn theo Mã Đơn Bán
app.delete('/api/returns/by-order/:orderId', async (req, res) => {
  const { orderId } = req.params;
  try {
    const conn = await getConnection();
    await conn.execute('DELETE FROM `returns` WHERE order_id = ?', [orderId]);
    await conn.end();

    res.json({ message: 'Đã xóa đơn hoàn tương ứng khỏi CSDL' });
  } catch (err) {
    console.error(`Lỗi DELETE /api/returns/by-order/${orderId}:`, err);
    res.status(500).json({ error: 'Xóa đơn hoàn thất bại' });
  }
});

// KHỞI CHẠY SERVER
app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 OMS Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`📊 Kết nối Database: phpMyAdmin (oms_db)`);
  console.log(`=================================`);
});