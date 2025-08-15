// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3000; // 我们定义后端服务运行在 3000 端口

// --- 中间件配置 ---
app.use(cors()); // 允许来自任何源的请求，方便小程序调试
app.use(express.json()); // 让服务器能解析小程序发来的 JSON 格式数据

// --- 数据库连接池配置 ---
const db = mysql.createPool({
    host: 'localhost',                // 数据库地址，本地就是 'localhost'
    user: 'root',                     // 你的 MySQL 用户名
    password: '20041128',  // !!! 替换成你自己的 MySQL root 密码 !!!
    database: 'my_groups_db'          // 我们在第二步中创建的数据库名
}).promise(); // 使用 .promise() 可以让我们使用更现代的 async/await 语法

// --- API 接口：用于创建小组 ---
app.post('/api/create-group', async (req, res) => {
    const { groupCode } = req.body; // 从请求体中获取 groupCode

    // 数据校验
    if (!groupCode || groupCode.length !== 8) {
        return res.status(400).json({ success: false, message: '无效的小组码' });
    }

    try {
        // 定义 SQL 插入语句
        const sql = 'INSERT INTO `groups` (groupCode) VALUES (?)';
        // 执行 SQL 语句
        await db.query(sql, [groupCode]);

        console.log(`[SUCCESS] 小组码 ${groupCode} 已成功存入数据库。`);
        // 向小程序返回成功信息
        res.json({ success: true, message: '小组创建成功' });

    } catch (error) {
        console.error('[ERROR] 数据库插入失败:', error);
        // 向小程序返回失败信息
        res.status(500).json({ success: false, message: '服务器内部错误，可能小组码已存在' });
    }
});
app.post('/api/check-group', async (req, res) => {
  const { groupCode } = req.body; // 从请求中获取 groupCode

  // 数据校验
  if (!groupCode || groupCode.length !== 8) {
      return res.status(400).json({ exists: false, message: '无效的小组码' });
  }

  try {
      // 定义 SQL 查询语句，COUNT(*) 用来统计符合条件的行数
      const sql = 'SELECT COUNT(*) as count FROM `groups` WHERE groupCode = ?';
      // 执行查询
      const [rows] = await db.query(sql, [groupCode]);

      const count = rows[0].count; // 获取查询到的行数

      if (count > 0) {
          // 如果行数大于0，说明小组码存在
          console.log(`[QUERY_SUCCESS] 小组码 ${groupCode} 存在。`);
          res.json({ exists: true, message: '小组存在' });
      } else {
          // 否则，说明小组码不存在
          console.log(`[QUERY_NOT_FOUND] 小组码 ${groupCode} 不存在。`);
          res.json({ exists: false, message: '小组不存在' });
      }

  } catch (error) {
      console.error('[QUERY_ERROR] 数据库查询失败:', error);
      res.status(500).json({ exists: false, message: '服务器查询错误' });
  }
});
app.post('/api/send-location', async (req, res) => {
  const { groupCode, latitude, longitude } = req.body;

  if (!groupCode || !latitude || !longitude) {
      return res.status(400).json({ status: 'error', message: '缺少必要参数' });
  }

  try {
      // 1. 查询当前小组的状态，看是否已有人提交位置
      const [groups] = await db.query('SELECT * FROM `groups` WHERE groupCode = ?', [groupCode]);

      if (groups.length === 0) {
          return res.status(404).json({ status: 'error', message: '小组不存在' });
      }

      const group = groups[0];

      // 2. 判断是否为第一个到达的成员 (通过 lat1 是否为 null 判断)
      if (group.lat1 === null) {
          // 是第一个成员，更新 lat1 和 lon1
          const updateSql = 'UPDATE `groups` SET lat1 = ?, lon1 = ? WHERE groupCode = ?';
          await db.query(updateSql, [latitude, longitude, groupCode]);
          console.log(`[LOCATION] 小组 ${groupCode} 的首个成员位置已记录。`);
          // 返回等待信息
          res.json({ status: 'waiting', message: '已记录您的位置，正在等待另一位成员...' });
      } else {
          // 是第二个成员
          // a. 计算中点
          const midLatitude = (parseFloat(group.lat1) + latitude) / 2;
          const midLongitude = (parseFloat(group.lon1) + longitude) / 2;

          // b. 更新 lat2 和 lon2 (可选，但推荐)
          const updateSql = 'UPDATE `groups` SET lat2 = ?, lon2 = ? WHERE groupCode = ?';
          await db.query(updateSql, [latitude, longitude, groupCode]);
          console.log(`[LOCATION] 小组 ${groupCode} 的第二个成员位置已记录，计算中点。`);

          // c. 返回计算完成状态和中点坐标
          res.json({
              status: 'complete',
              message: '中点计算完成！',
              midpoint: {
                  latitude: midLatitude,
                  longitude: midLongitude,
                  name: '建议会面点' // 你可以给中点起一个名字
              }
          });
      }
  } catch (error) {
      console.error('[LOCATION_ERROR] 位置处理失败:', error);
      res.status(500).json({ status: 'error', message: '服务器处理位置失败' });
  }
});
// --- 启动服务器 ---
app.listen(port, () => {
    console.log(`本地后端服务已启动，正在监听 http://localhost:${port}`);
});