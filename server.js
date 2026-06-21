const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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

db.exec(`
  CREATE TABLE IF NOT EXISTS training_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER,
    training_date TEXT NOT NULL,
    actual_duration INTEGER NOT NULL,
    calories_burned INTEGER DEFAULT 0,
    feeling_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS training_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    default_duration INTEGER NOT NULL,
    exercise_description TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const planCountStmt = db.prepare('SELECT COUNT(*) as count FROM workout_plans');
const planCount = planCountStmt.get().count;

if (planCount === 0) {
  const insertPlanStmt = db.prepare(`
    INSERT INTO workout_plans (name, type, plan_date, duration, completed, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const today = new Date();
  const getDateStr = (daysOffset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysOffset);
    return formatLocalDate(d);
  };

  const samplePlans = [
    ['晨跑5公里', '有氧', getDateStr(-2), 30, 1, '状态不错，配速6分以内'],
    ['力量训练-上肢', '力量', getDateStr(-1), 45, 1, '卧推40kg，3组12次'],
    ['瑜伽拉伸', '柔韧', getDateStr(0), 60, 0, '晚上八点，记得带瑜伽垫'],
    ['HIIT燃脂', '有氧', getDateStr(1), 25, 0, '高强度间歇训练'],
    ['核心训练', '力量', getDateStr(2), 35, 0, '平板支撑、卷腹、俄罗斯转体'],
    ['游泳', '有氧', getDateStr(3), 90, 0, '自由泳1000米'],
    ['休息日-轻度散步', '恢复', getDateStr(4), 40, 0, '轻松散步，放松肌肉']
  ];

  const insertManyPlans = db.transaction((data) => {
    for (const row of data) {
      insertPlanStmt.run(...row);
    }
  });

  insertManyPlans(samplePlans);
  console.log('已插入示例计划数据');

  const recordCountStmt = db.prepare('SELECT COUNT(*) as count FROM training_records');
  const recordCount = recordCountStmt.get().count;

  if (recordCount === 0) {
    const insertRecordStmt = db.prepare(`
      INSERT INTO training_records (plan_id, training_date, actual_duration, calories_burned, feeling_notes)
      VALUES (?, ?, ?, ?, ?)
    `);

    const sampleRecords = [
      [1, getDateStr(-2), 32, 280, '早晨空气很好，跑完很舒畅'],
      [2, getDateStr(-1), 50, 350, '卧推比上次多做了一组，手臂有点酸']
    ];

    const insertManyRecords = db.transaction((data) => {
      for (const row of data) {
        insertRecordStmt.run(...row);
      }
    });

    insertManyRecords(sampleRecords);
    console.log('已插入示例训练记录数据');
  }

  const templateCountStmt = db.prepare('SELECT COUNT(*) as count FROM training_templates');
  const templateCount = templateCountStmt.get().count;

  if (templateCount === 0) {
    const insertTemplateStmt = db.prepare(`
      INSERT INTO training_templates (name, type, default_duration, exercise_description, notes)
      VALUES (?, ?, ?, ?, ?)
    `);

    const sampleTemplates = [
      ['标准晨跑', '有氧', 30, '热身5分钟 -> 匀速跑步20分钟 -> 拉伸5分钟，配速控制在6-7分钟/公里', '适合工作日早晨，保持中等强度'],
      ['上肢力量训练', '力量', 45, '卧推4组x12次、哑铃飞鸟3组x15次、俯卧撑3组x15次、二头弯举3组x12次', '注意动作标准，避免借力'],
      ['下肢力量训练', '力量', 50, '深蹲4组x15次、箭步蹲3组x12次/腿、腿举3组x15次、小腿提踵4组x20次', '下蹲时膝盖不超过脚尖'],
      ['核心强化', '力量', 35, '平板支撑3组x60秒、卷腹3组x20次、俄罗斯转体3组x20次、登山跑3组x30秒', '保持核心收紧，呼吸均匀'],
      ['HIIT燃脂', '有氧', 25, '开合跳30秒、高抬腿30秒、波比跳20秒、深蹲跳30秒、休息30秒，循环5组', '高强度训练，注意量力而行'],
      ['瑜伽放松', '柔韧', 60, '拜日式x5组 -> 战士式 -> 三角式 -> 坐角式 -> 仰卧扭转 -> 挺尸式放松', '配合深呼吸，每个动作保持5-8个呼吸'],
      ['游泳训练', '有氧', 90, '热身50米 -> 自由泳400米 -> 蛙泳200米 -> 仰泳200米 -> 放松游150米', '注意换气节奏，提前补充水分']
    ];

    const insertManyTemplates = db.transaction((data) => {
      for (const row of data) {
        insertTemplateStmt.run(...row);
      }
    });

    insertManyTemplates(sampleTemplates);
    console.log('已插入示例训练模板数据');
  }
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

  try {
    const weekStart = formatLocalDate(monday);
    const weekEnd = formatLocalDate(sunday);

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

app.get('/api/plans/monthly-stats', (req, res) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const monthStart = `${year}-${month}-01`;
  const nextMonth = today.getMonth() + 1 > 11 ? 1 : today.getMonth() + 2;
  const nextYear = today.getMonth() + 1 > 11 ? year + 1 : year;
  const monthEndDate = new Date(nextYear, nextMonth - 1, 0);
  const monthEnd = formatLocalDate(monthEndDate);

  try {
    const countStmt = db.prepare(`
      SELECT COUNT(*) as totalRecords FROM training_records
      WHERE training_date >= ? AND training_date <= ?
    `);
    const countResult = countStmt.get(monthStart, monthEnd);

    const durationStmt = db.prepare(`
      SELECT COALESCE(SUM(actual_duration), 0) as totalDuration FROM training_records
      WHERE training_date >= ? AND training_date <= ?
    `);
    const durationResult = durationStmt.get(monthStart, monthEnd);

    const caloriesStmt = db.prepare(`
      SELECT COALESCE(SUM(calories_burned), 0) as totalCalories FROM training_records
      WHERE training_date >= ? AND training_date <= ?
    `);
    const caloriesResult = caloriesStmt.get(monthStart, monthEnd);

    res.json({
      monthStart,
      monthEnd,
      totalRecords: countResult.totalRecords,
      totalDuration: durationResult.totalDuration,
      totalCalories: caloriesResult.totalCalories
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
    const records = db.prepare('SELECT * FROM training_records WHERE plan_id = ? ORDER BY training_date DESC, id DESC').all(req.params.id);
    res.json({ ...plan, records });
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

    db.prepare('DELETE FROM training_records WHERE plan_id = ?').run(req.params.id);
    db.prepare('DELETE FROM workout_plans WHERE id = ?').run(req.params.id);
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/records', (req, res) => {
  const { plan_id } = req.query;
  let sql = 'SELECT * FROM training_records WHERE 1=1';
  const params = [];

  if (plan_id) {
    sql += ' AND plan_id = ?';
    params.push(plan_id);
  }

  sql += ' ORDER BY training_date DESC, id DESC';

  try {
    const records = db.prepare(sql).all(...params);
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/records/:id', (req, res) => {
  try {
    const record = db.prepare('SELECT * FROM training_records WHERE id = ?').get(req.params.id);
    if (!record) {
      return res.status(404).json({ error: '训练记录不存在' });
    }
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/records', (req, res) => {
  const { plan_id, training_date, actual_duration, calories_burned = 0, feeling_notes = '' } = req.body;

  if (!training_date || !actual_duration) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  if (plan_id) {
    const planExists = db.prepare('SELECT id FROM workout_plans WHERE id = ?').get(plan_id);
    if (!planExists) {
      return res.status(400).json({ error: '关联的训练计划不存在' });
    }
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO training_records (plan_id, training_date, actual_duration, calories_burned, feeling_notes)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(plan_id || null, training_date, actual_duration, calories_burned, feeling_notes);
    const newRecord = db.prepare('SELECT * FROM training_records WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newRecord);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/records/:id', (req, res) => {
  const { plan_id, training_date, actual_duration, calories_burned, feeling_notes } = req.body;

  try {
    const existing = db.prepare('SELECT * FROM training_records WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '训练记录不存在' });
    }

    if (plan_id !== undefined && plan_id !== null) {
      const planExists = db.prepare('SELECT id FROM workout_plans WHERE id = ?').get(plan_id);
      if (!planExists) {
        return res.status(400).json({ error: '关联的训练计划不存在' });
      }
    }

    const updatedPlanId = plan_id !== undefined ? (plan_id || null) : existing.plan_id;
    const updatedTrainingDate = training_date !== undefined ? training_date : existing.training_date;
    const updatedDuration = actual_duration !== undefined ? actual_duration : existing.actual_duration;
    const updatedCalories = calories_burned !== undefined ? calories_burned : existing.calories_burned;
    const updatedNotes = feeling_notes !== undefined ? feeling_notes : existing.feeling_notes;

    const stmt = db.prepare(`
      UPDATE training_records
      SET plan_id = ?, training_date = ?, actual_duration = ?, calories_burned = ?, feeling_notes = ?
      WHERE id = ?
    `);
    stmt.run(updatedPlanId, updatedTrainingDate, updatedDuration, updatedCalories, updatedNotes, req.params.id);

    const updatedRecord = db.prepare('SELECT * FROM training_records WHERE id = ?').get(req.params.id);
    res.json(updatedRecord);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/records/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM training_records WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '训练记录不存在' });
    }

    db.prepare('DELETE FROM training_records WHERE id = ?').run(req.params.id);
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/templates', (req, res) => {
  const { type } = req.query;
  let sql = 'SELECT * FROM training_templates WHERE 1=1';
  const params = [];

  if (type && type !== 'all') {
    sql += ' AND type = ?';
    params.push(type);
  }

  sql += ' ORDER BY id DESC';

  try {
    const templates = db.prepare(sql).all(...params);
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/templates/:id', (req, res) => {
  try {
    const template = db.prepare('SELECT * FROM training_templates WHERE id = ?').get(req.params.id);
    if (!template) {
      return res.status(404).json({ error: '模板不存在' });
    }
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/templates', (req, res) => {
  const { name, type, default_duration, exercise_description = '', notes = '' } = req.body;

  if (!name || !type || !default_duration) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO training_templates (name, type, default_duration, exercise_description, notes)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, type, default_duration, exercise_description, notes);
    const newTemplate = db.prepare('SELECT * FROM training_templates WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newTemplate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/templates/:id', (req, res) => {
  const { name, type, default_duration, exercise_description, notes } = req.body;

  try {
    const existing = db.prepare('SELECT * FROM training_templates WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '模板不存在' });
    }

    const updatedName = name !== undefined ? name : existing.name;
    const updatedType = type !== undefined ? type : existing.type;
    const updatedDuration = default_duration !== undefined ? default_duration : existing.default_duration;
    const updatedDesc = exercise_description !== undefined ? exercise_description : existing.exercise_description;
    const updatedNotes = notes !== undefined ? notes : existing.notes;

    const stmt = db.prepare(`
      UPDATE training_templates
      SET name = ?, type = ?, default_duration = ?, exercise_description = ?, notes = ?
      WHERE id = ?
    `);
    stmt.run(updatedName, updatedType, updatedDuration, updatedDesc, updatedNotes, req.params.id);

    const updatedTemplate = db.prepare('SELECT * FROM training_templates WHERE id = ?').get(req.params.id);
    res.json(updatedTemplate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/templates/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM training_templates WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: '模板不存在' });
    }

    db.prepare('DELETE FROM training_templates WHERE id = ?').run(req.params.id);
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/plans/batch-toggle', (req, res) => {
  const { ids, completed } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: '请选择要操作的计划' });
  }

  if (completed === undefined || completed === null) {
    return res.status(400).json({ error: '缺少完成状态参数' });
  }

  try {
    const completedVal = completed ? 1 : 0;
    const numericIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    if (numericIds.length === 0) {
      return res.status(400).json({ error: '无效的计划ID' });
    }
    const placeholders = numericIds.map(() => '?').join(',');
    const updateStmt = db.prepare(`UPDATE workout_plans SET completed = ? WHERE id IN (${placeholders})`);
    const result = updateStmt.run(completedVal, ...numericIds);
    res.json({ message: `成功更新 ${result.changes} 条计划`, updated: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/plans/batch-delete', (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: '请选择要删除的计划' });
  }

  try {
    const numericIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    if (numericIds.length === 0) {
      return res.status(400).json({ error: '无效的计划ID' });
    }
    const placeholders = numericIds.map(() => '?').join(',');
    db.prepare(`DELETE FROM training_records WHERE plan_id IN (${placeholders})`).run(...numericIds);
    const result = db.prepare(`DELETE FROM workout_plans WHERE id IN (${placeholders})`).run(...numericIds);
    res.json({ message: `成功删除 ${result.changes} 条计划`, deleted: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/templates/batch-delete', (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: '请选择要删除的模板' });
  }

  try {
    const numericIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    if (numericIds.length === 0) {
      return res.status(400).json({ error: '无效的模板ID' });
    }
    const placeholders = numericIds.map(() => '?').join(',');
    const result = db.prepare(`DELETE FROM training_templates WHERE id IN (${placeholders})`).run(...numericIds);
    res.json({ message: `成功删除 ${result.changes} 条模板`, deleted: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
