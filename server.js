const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new Database('workout.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS workout_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    plan_date TEXT NOT NULL,
    duration INTEGER NOT NULL,
    completed INTEGER DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const countStmt = db.prepare('SELECT COUNT(*) as count FROM workout_plans');
const count = countStmt.get().count;

if (count === 0) {
  const insertStmt = db.prepare(`
    INSERT INTO workout_plans (name, type, plan_date, duration, completed, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const today = new Date();
  const getDateStr = (daysOffset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  };

  const sampleData = [
    ['晨跑5公里', '有氧', getDateStr(-2), 30, 1, '状态不错，配速6分以内'],
    ['力量训练-上肢', '力量', getDateStr(-1), 45, 1, '卧推40kg，3组12次'],
    ['瑜伽拉伸', '柔韧', getDateStr(0), 60, 0, '晚上八点，记得带瑜伽垫'],
    ['HIIT燃脂', '有氧', getDateStr(1), 25, 0, '高强度间歇训练'],
    ['核心训练', '力量', getDateStr(2), 35, 0, '平板支撑、卷腹、俄罗斯转体'],
    ['游泳', '有氧', getDateStr(3), 90, 0, '自由泳1000米'],
    ['休息日-轻度散步', '恢复', getDateStr(4), 40, 0, '轻松散步，放松肌肉']
  ];

  const insertMany = db.transaction((data) => {
    for (const row of data) {
      insertStmt.run(...row);
    }
  });

  insertMany(sampleData);
  console.log('已插入示例数据');
}

app.get('/api/plans', (req, res) => {
  const { type, date, completed, startDate, endDate } = req.query;
  let sql = 'SELECT * FROM workout_plans WHERE 1=1';
  const params = [];

  if (type && type !== 'all') {
    sql += ' AND type = ?';
    params.push(type);
  }

  if (date) {
    sql += ' AND plan_date = ?';
    params.push(date);
  }

  if (startDate) {
    sql += ' AND plan_date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    sql += ' AND plan_date <= ?';
    params.push(endDate);
  }

  if (completed !== undefined && completed !== '' && completed !== 'all') {
    sql += ' AND completed = ?';
    params.push(completed === 'true' || completed === '1' ? 1 : 0);
  }

  sql += ' ORDER BY plan_date ASC, id DESC';

  try {
    const plans = db.prepare(sql).all(...params);
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/plans/stats', (req, res) => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const formatDate = (d) => d.toISOString().split('T')[0];

  try {
    const weekStart = formatDate(monday);
    const weekEnd = formatDate(sunday);

    const totalStmt = db.prepare(`
      SELECT COUNT(*) as total FROM workout_plans
      WHERE plan_date >= ? AND plan_date <= ?
    `);
    const totalResult = totalStmt.get(weekStart, weekEnd);

    const completedStmt = db.prepare(`
      SELECT COUNT(*) as completed FROM workout_plans
      WHERE plan_date >= ? AND plan_date <= ? AND completed = 1
    `);
    const completedResult = completedStmt.get(weekStart, weekEnd);

    const durationStmt = db.prepare(`
      SELECT COALESCE(SUM(duration), 0) as totalDuration FROM workout_plans
      WHERE plan_date >= ? AND plan_date <= ? AND completed = 1
    `);
    const durationResult = durationStmt.get(weekStart, weekEnd);

    res.json({
      weekStart,
      weekEnd,
      totalPlans: totalResult.total,
      completedPlans: completedResult.completed,
      totalDuration: durationResult.totalDuration
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/plans/types', (req, res) => {
  try {
    const types = db.prepare('SELECT DISTINCT type FROM workout_plans ORDER BY type').all().map(r => r.type);
    res.json(types);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/plans/:id', (req, res) => {
  try {
    const plan = db.prepare('SELECT * FROM workout_plans WHERE id = ?').get(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: '计划不存在' });
    }
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/plans', (req, res) => {
  const { name, type, plan_date, duration, completed = 0, notes = '' } = req.body;

  if (!name || !type || !plan_date || !duration) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO workout_plans (name, type, plan_date, duration, completed, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, type, plan_date, duration, completed ? 1 : 0, notes);
    const newPlan = db.prepare('SELECT * FROM workout_plans WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newPlan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/plans/:id', (req, res) => {
  const { name, type, plan_date, duration, completed, notes } = req.body;

  try {
    const existing = db.prepare('SELECT * FROM workout_plans WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '计划不存在' });
    }

    const updatedName = name !== undefined ? name : existing.name;
    const updatedType = type !== undefined ? type : existing.type;
    const updatedDate = plan_date !== undefined ? plan_date : existing.plan_date;
    const updatedDuration = duration !== undefined ? duration : existing.duration;
    const updatedCompleted = completed !== undefined ? (completed ? 1 : 0) : existing.completed;
    const updatedNotes = notes !== undefined ? notes : existing.notes;

    const stmt = db.prepare(`
      UPDATE workout_plans
      SET name = ?, type = ?, plan_date = ?, duration = ?, completed = ?, notes = ?
      WHERE id = ?
    `);
    stmt.run(updatedName, updatedType, updatedDate, updatedDuration, updatedCompleted, updatedNotes, req.params.id);

    const updatedPlan = db.prepare('SELECT * FROM workout_plans WHERE id = ?').get(req.params.id);
    res.json(updatedPlan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/plans/:id/toggle', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM workout_plans WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '计划不存在' });
    }

    const newCompleted = existing.completed ? 0 : 1;
    db.prepare('UPDATE workout_plans SET completed = ? WHERE id = ?').run(newCompleted, req.params.id);

    const updatedPlan = db.prepare('SELECT * FROM workout_plans WHERE id = ?').get(req.params.id);
    res.json(updatedPlan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/plans/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM workout_plans WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '计划不存在' });
    }

    db.prepare('DELETE FROM workout_plans WHERE id = ?').run(req.params.id);
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
