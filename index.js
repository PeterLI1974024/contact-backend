const express = require('express');
const { Pool } = require('pg');
const app = express();

const pool = new Pool({
  user: process.env.DB_USER || 'myuser',
  // 【關鍵修改在這裡】把 'localhost' 改成 process.env.DB_HOST
  // 這樣 Docker 容器就會去查詢名為 'db' 的服務 IP
  host: process.env.DB_HOST || 'localhost', 
  database: process.env.DB_NAME || 'contact_list',
  password: process.env.DB_PASSWORD || 'mypassword',
  port: 5432,
});
app.use(express.json());

// 初始化資料表
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL
      );
    `);
    console.log("資料庫表格已準備就緒！");
  } catch (err) {
    console.error("資料庫連線失敗：", err.message);
  }
};
initDb();

// GET: 取得所有聯絡人
app.get('/contacts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contacts');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/contacts', async (req, res) => {
  const { name, phone } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO contacts (name, phone) VALUES ($1, $2) RETURNING *',
      [name, phone]
    );
    console.log("成功新增聯絡人：", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log('伺服器運行中：http://localhost:3000');
});