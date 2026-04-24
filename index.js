const express = require('express');
const { Pool } = require('pg');

const app = express();

app.use(express.json());

// 建立 DB 連線池
const pool = new Pool({
  user: process.env.DB_USER || 'myuser',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'contact_list',
  password: process.env.DB_PASSWORD || 'mypassword',
  port: 5432,
});


// 🔥 等待資料庫 ready（解決 Docker 啟動順序問題）
const waitForDb = async (retries = 10) => {
  while (retries > 0) {
    try {
      await pool.query('SELECT 1');
      console.log('✅ 資料庫連線成功');
      return;
    } catch (err) {
      console.log(`⏳ 等待資料庫啟動中... (${retries - 1} 次重試)`);
      retries--;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  throw new Error('❌ 資料庫啟動逾時，無法連線');
};


// 🔥 初始化 DB
const initDb = async () => {
  try {
    await waitForDb();

    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL
      );
    `);

    console.log("✅ 資料庫表格已準備就緒！");
  } catch (err) {
    console.error("❌ 資料庫初始化失敗：", err.message);
  }
};

initDb();


// 📌 API - 取得所有聯絡人
app.get('/contacts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contacts ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 📌 API - 新增聯絡人
app.post('/contacts', async (req, res) => {
  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'name 和 phone 必填' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO contacts (name, phone) VALUES ($1, $2) RETURNING *',
      [name, phone]
    );

    console.log("✅ 成功新增聯絡人：", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🚀 啟動 server
app.listen(3000, () => {
  console.log('🚀 伺服器運行中：http://localhost:3000');
});