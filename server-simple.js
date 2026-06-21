const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const DATA_FILE = path.join(__dirname, 'data.json');

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DEFAULT_DATA = {
  plans: [],
  records: [],
  templates: []
};

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('读取数据文件失败:', err.message);
  }
  return { ...DEFAULT_DATA };
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('保存数据失败:', err.message);
    return false;
  }
}

function initSampleData() {
  const data = loadData();
  if (data.plans.length === 0) {
    const today = new Date();
    const getDateStr = (daysOffset) => {
      const d = new Date(today);
      d.setDate(d.getDate() + daysOffset);
      return formatLocalDate(d);
    };

    data.plans = [
      { id: 1, name: '晨跑5公里', type: '有氧', plan_date: getDateStr(-2), duration: 30, completed: 1, notes: '状态不错，配速6分以内', created_at: new Date().toISOString() },
      { id: 2, name: '力量训练-上肢', type: '力量', plan_date: getDateStr(-1), duration: 45, completed: 1, notes: '卧推40kg，3组12次', created_at: new Date().toISOString() },
      { id: 3, name: '瑜伽拉伸', type: '柔韧', plan_date: getDateStr(0), duration: 60, completed: 0, notes: '晚上八点，记得带瑜伽垫', created_at: new Date().toISOString() },
      { id: 4, name: 'HIIT燃脂', type: '有氧', plan_date: getDateStr(1), duration: 25, completed: 0, notes: '高强度间歇训练', created_at: new Date().toISOString() },
      { id: 5, name: '核心训练', type: '力量', plan_date: getDateStr(2), duration: 35, completed: 0, notes: '平板支撑、卷腹、俄罗斯转体', created_at: new Date().toISOString() },
      { id: 6, name: '游泳', type: '有氧', plan_date: getDateStr(3), duration: 90, completed: 0, notes: '自由泳1000米', created_at: new Date().toISOString() },
      { id: 7, name: '休息日-轻度散步', type: '恢复', plan_date: getDateStr(4), duration: 40, completed: 0, notes: '轻松散步，放松肌肉', created_at: new Date().toISOString() }
    ];

    data.records = [
      { id: 1, plan_id: 1, training_date: getDateStr(-2), actual_duration: 32, calories_burned: 280, feeling_notes: '早晨空气很好，跑完很舒畅', created_at: new Date().toISOString() },
      { id: 2, plan_id: 2, training_date: getDateStr(-1), actual_duration: 50, calories_burned: 350, feeling_notes: '卧推比上次多做了一组，手臂有点酸', created_at: new Date().toISOString() }
    ];

    data.templates = [
      { id: 1, name: '标准晨跑', type: '有氧', default_duration: 30, exercise_description: '热身5分钟 -> 匀速跑步20分钟 -> 拉伸5分钟，配速控制在6-7分钟/公里', notes: '适合工作日早晨，保持中等强度', created_at: new Date().toISOString() },
      { id: 2, name: '上肢力量训练', type: '力量', default_duration: 45, exercise_description: '卧推4组x12次、哑铃飞鸟3组x15次、俯卧撑3组x15次、二头弯举3组x12次', notes: '注意动作标准，避免借力', created_at: new Date().toISOString() },
      { id: 3, name: '下肢力量训练', type: '力量', default_duration: 50, exercise_description: '深蹲4组x15次、箭步蹲3组x12次/腿、腿举3组x15次、小腿提踵4组x20次', notes: '下蹲时膝盖不超过脚尖', created_at: new Date().toISOString() },
      { id: 4, name: '核心强化', type: '力量', default_duration: 35, exercise_description: '平板支撑3组x60秒、卷腹3组x20次、俄罗斯转体3组x20次、登山跑3组x30秒', notes: '保持核心收紧，呼吸均匀', created_at: new Date().toISOString() },
      { id: 5, name: 'HIIT燃脂', type: '有氧', default_duration: 25, exercise_description: '开合跳30秒、高抬腿30秒、波比跳20秒、深蹲跳30秒、休息30秒，循环5组', notes: '高强度训练，注意量力而行', created_at: new Date().toISOString() },
      { id: 6, name: '瑜伽放松', type: '柔韧', default_duration: 60, exercise_description: '拜日式x5组 -> 战士式 -> 三角式 -> 坐角式 -> 仰卧扭转 -> 挺尸式放松', notes: '配合深呼吸，每个动作保持5-8个呼吸', created_at: new Date().toISOString() },
      { id: 7, name: '游泳训练', type: '有氧', default_duration: 90, exercise_description: '热身50米 -> 自由泳400米 -> 蛙泳200米 -> 仰泳200米 -> 放松游150米', notes: '注意换气节奏，提前补充水分', created_at: new Date().toISOString() }
    ];

    saveData(data);
    console.log('已插入示例数据');
  }
  if (!data.records) {
    data.records = [];
    saveData(data);
  }
  if (!data.templates) {
    data.templates = [];
    saveData(data);
  }
  return data;
}

let appData = initSampleData();
let nextPlanId = appData.plans.length > 0 ? Math.max(...appData.plans.map(p => p.id)) + 1 : 1;
let nextRecordId = appData.records && appData.records.length > 0 ? Math.max(...appData.records.map(r => r.id)) + 1 : 1;
let nextTemplateId = appData.templates && appData.templates.length > 0 ? Math.max(...appData.templates.map(t => t.id)) + 1 : 1;

function getNextPlanId() {
  return nextPlanId++;
}

function getNextRecordId() {
  return nextRecordId++;
}

function getNextTemplateId() {
  return nextTemplateId++;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function sendStaticFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType + '; charset=utf-8' });
      res.end(content);
    }
  });
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };
  return types[ext] || 'application/octet-stream';
}

function parseQueryString(url) {
  const queryIndex = url.indexOf('?');
  if (queryIndex === -1) return {};
  const queryStr = url.substring(queryIndex + 1);
  const params = {};
  queryStr.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
  });
  return params;
}

function filterPlans(plans, query) {
  let filtered = [...plans];

  if (query.type && query.type !== 'all') {
    filtered = filtered.filter(p => p.type === query.type);
  }

  if (query.date) {
    filtered = filtered.filter(p => p.plan_date === query.date);
  }

  if (query.startDate) {
    filtered = filtered.filter(p => p.plan_date >= query.startDate);
  }

  if (query.endDate) {
    filtered = filtered.filter(p => p.plan_date <= query.endDate);
  }

  if (query.completed !== undefined && query.completed !== '' && query.completed !== 'all') {
    const isCompleted = query.completed === 'true' || query.completed === '1';
    filtered = filtered.filter(p => (p.completed ? true : false) === isCompleted);
  }

  filtered.sort((a, b) => {
    if (a.plan_date !== b.plan_date) {
      return a.plan_date.localeCompare(b.plan_date);
    }
    return b.id - a.id;
  });

  return filtered;
}

function getWeekStats() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const weekStart = formatLocalDate(monday);
  const weekEnd = formatLocalDate(sunday);

  const weekPlans = appData.plans.filter(p => p.plan_date >= weekStart && p.plan_date <= weekEnd);
  const completedPlans = weekPlans.filter(p => p.completed);
  const totalDuration = completedPlans.reduce((sum, p) => sum + p.duration, 0);

  return {
    weekStart,
    weekEnd,
    totalPlans: weekPlans.length,
    completedPlans: completedPlans.length,
    totalDuration
  };
}

function getMonthlyStats() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const monthStart = `${year}-${month}-01`;
  const nextMonth = today.getMonth() + 1 > 11 ? 1 : today.getMonth() + 2;
  const nextYear = today.getMonth() + 1 > 11 ? year + 1 : year;
  const monthEndDate = new Date(nextYear, nextMonth - 1, 0);
  const monthEnd = formatLocalDate(monthEndDate);

  const monthRecords = (appData.records || []).filter(r => r.training_date >= monthStart && r.training_date <= monthEnd);
  const totalDuration = monthRecords.reduce((sum, r) => sum + r.actual_duration, 0);
  const totalCalories = monthRecords.reduce((sum, r) => sum + (r.calories_burned || 0), 0);

  return {
    monthStart,
    monthEnd,
    totalRecords: monthRecords.length,
    totalDuration,
    totalCalories
  };
}

function getPlanTypes() {
  const types = [...new Set(appData.plans.map(p => p.type))];
  return types.sort();
}

const server = http.createServer(async (req, res) => {
  const url = req.url;
  const method = req.method;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  if (url === '/' || url === '/index.html') {
    sendStaticFile(res, path.join(__dirname, 'public', 'index.html'), 'text/html');
    return;
  }

  if (url.startsWith('/public/') || url.startsWith('/style.css') || url.startsWith('/app.js') || url.startsWith('/favicon.ico')) {
    let filePath = url;
    if (!filePath.startsWith('/public/') && filePath !== '/favicon.ico') {
      filePath = '/public' + filePath;
    }
    const fullPath = path.join(__dirname, filePath);
    const mimeType = getMimeType(fullPath);
    sendStaticFile(res, fullPath, mimeType);
    return;
  }

  if (url.startsWith('/api/plans/types') && method === 'GET') {
    sendJSON(res, 200, getPlanTypes());
    return;
  }

  if (url.startsWith('/api/plans/stats') && method === 'GET') {
    sendJSON(res, 200, getWeekStats());
    return;
  }

  if (url.startsWith('/api/plans/monthly-stats') && method === 'GET') {
    sendJSON(res, 200, getMonthlyStats());
    return;
  }

  const planToggleMatch = url.match(/^\/api\/plans\/(\d+)\/toggle$/);
  if (planToggleMatch && method === 'PATCH') {
    const id = parseInt(planToggleMatch[1]);
    const plan = appData.plans.find(p => p.id === id);
    if (!plan) {
      sendJSON(res, 404, { error: '计划不存在' });
      return;
    }
    plan.completed = plan.completed ? 0 : 1;
    saveData(appData);
    sendJSON(res, 200, plan);
    return;
  }

  const planDetailMatch = url.match(/^\/api\/plans\/(\d+)$/);
  if (planDetailMatch) {
    const id = parseInt(planDetailMatch[1]);
    const plan = appData.plans.find(p => p.id === id);

    if (method === 'GET') {
      if (!plan) {
        sendJSON(res, 404, { error: '计划不存在' });
        return;
      }
      const records = (appData.records || []).filter(r => r.plan_id === id).sort((a, b) => {
        if (a.training_date !== b.training_date) return b.training_date.localeCompare(a.training_date);
        return b.id - a.id;
      });
      sendJSON(res, 200, { ...plan, records });
      return;
    }

    if (method === 'PUT') {
      if (!plan) {
        sendJSON(res, 404, { error: '计划不存在' });
        return;
      }
      try {
        const body = await parseBody(req);
        if (body.name !== undefined) plan.name = body.name;
        if (body.type !== undefined) plan.type = body.type;
        if (body.plan_date !== undefined) plan.plan_date = body.plan_date;
        if (body.duration !== undefined) plan.duration = body.duration;
        if (body.completed !== undefined) plan.completed = body.completed ? 1 : 0;
        if (body.notes !== undefined) plan.notes = body.notes;
        saveData(appData);
        sendJSON(res, 200, plan);
      } catch (err) {
        sendJSON(res, 400, { error: '请求体格式错误' });
      }
      return;
    }

    if (method === 'DELETE') {
      if (!plan) {
        sendJSON(res, 404, { error: '计划不存在' });
        return;
      }
      appData.plans = appData.plans.filter(p => p.id !== id);
      appData.records = (appData.records || []).filter(r => r.plan_id !== id);
      saveData(appData);
      sendJSON(res, 200, { message: '删除成功' });
      return;
    }
  }

  if (url.startsWith('/api/plans')) {
    const query = parseQueryString(url);

    if (method === 'GET') {
      const filtered = filterPlans(appData.plans, query);
      sendJSON(res, 200, filtered);
      return;
    }

    if (method === 'POST') {
      try {
        const body = await parseBody(req);
        const { name, type, plan_date, duration, completed = 0, notes = '' } = body;

        if (!name || !type || !plan_date || !duration) {
          sendJSON(res, 400, { error: '缺少必填字段' });
          return;
        }

        const newPlan = {
          id: getNextPlanId(),
          name,
          type,
          plan_date,
          duration,
          completed: completed ? 1 : 0,
          notes,
          created_at: new Date().toISOString()
        };

        appData.plans.push(newPlan);
        saveData(appData);
        sendJSON(res, 201, newPlan);
      } catch (err) {
        sendJSON(res, 400, { error: '请求体格式错误' });
      }
      return;
    }
  }

  const recordDetailMatch = url.match(/^\/api\/records\/(\d+)$/);
  if (recordDetailMatch) {
    const id = parseInt(recordDetailMatch[1]);
    const record = (appData.records || []).find(r => r.id === id);

    if (method === 'GET') {
      if (!record) {
        sendJSON(res, 404, { error: '训练记录不存在' });
        return;
      }
      sendJSON(res, 200, record);
      return;
    }

    if (method === 'PUT') {
      if (!record) {
        sendJSON(res, 404, { error: '训练记录不存在' });
        return;
      }
      try {
        const body = await parseBody(req);

        if (body.plan_id !== undefined && body.plan_id !== null) {
          const planExists = appData.plans.find(p => p.id === body.plan_id);
          if (!planExists) {
            sendJSON(res, 400, { error: '关联的训练计划不存在' });
            return;
          }
        }

        if (body.plan_id !== undefined) record.plan_id = body.plan_id || null;
        if (body.training_date !== undefined) record.training_date = body.training_date;
        if (body.actual_duration !== undefined) record.actual_duration = body.actual_duration;
        if (body.calories_burned !== undefined) record.calories_burned = body.calories_burned;
        if (body.feeling_notes !== undefined) record.feeling_notes = body.feeling_notes;
        saveData(appData);
        sendJSON(res, 200, record);
      } catch (err) {
        sendJSON(res, 400, { error: '请求体格式错误' });
      }
      return;
    }

    if (method === 'DELETE') {
      if (!record) {
        sendJSON(res, 404, { error: '训练记录不存在' });
        return;
      }
      appData.records = appData.records.filter(r => r.id !== id);
      saveData(appData);
      sendJSON(res, 200, { message: '删除成功' });
      return;
    }
  }

  if (url.startsWith('/api/records')) {
    const query = parseQueryString(url);

    if (method === 'GET') {
      let records = [...(appData.records || [])];
      if (query.plan_id) {
        records = records.filter(r => r.plan_id === parseInt(query.plan_id));
      }
      records.sort((a, b) => {
        if (a.training_date !== b.training_date) return b.training_date.localeCompare(a.training_date);
        return b.id - a.id;
      });
      sendJSON(res, 200, records);
      return;
    }

    if (method === 'POST') {
      try {
        const body = await parseBody(req);
        const { plan_id, training_date, actual_duration, calories_burned = 0, feeling_notes = '' } = body;

        if (!training_date || !actual_duration) {
          sendJSON(res, 400, { error: '缺少必填字段' });
          return;
        }

        if (plan_id) {
          const planExists = appData.plans.find(p => p.id === plan_id);
          if (!planExists) {
            sendJSON(res, 400, { error: '关联的训练计划不存在' });
            return;
          }
        }

        const newRecord = {
          id: getNextRecordId(),
          plan_id: plan_id || null,
          training_date,
          actual_duration,
          calories_burned,
          feeling_notes,
          created_at: new Date().toISOString()
        };

        if (!appData.records) appData.records = [];
        appData.records.push(newRecord);
        saveData(appData);
        sendJSON(res, 201, newRecord);
      } catch (err) {
        sendJSON(res, 400, { error: '请求体格式错误' });
      }
      return;
    }
  }

  const templateDetailMatch = url.match(/^\/api\/templates\/(\d+)$/);
  if (templateDetailMatch) {
    const id = parseInt(templateDetailMatch[1]);
    const template = (appData.templates || []).find(t => t.id === id);

    if (method === 'GET') {
      if (!template) {
        sendJSON(res, 404, { error: '模板不存在' });
        return;
      }
      sendJSON(res, 200, template);
      return;
    }

    if (method === 'PUT') {
      if (!template) {
        sendJSON(res, 404, { error: '模板不存在' });
        return;
      }
      try {
        const body = await parseBody(req);
        if (body.name !== undefined) template.name = body.name;
        if (body.type !== undefined) template.type = body.type;
        if (body.default_duration !== undefined) template.default_duration = body.default_duration;
        if (body.exercise_description !== undefined) template.exercise_description = body.exercise_description;
        if (body.notes !== undefined) template.notes = body.notes;
        saveData(appData);
        sendJSON(res, 200, template);
      } catch (err) {
        sendJSON(res, 400, { error: '请求体格式错误' });
      }
      return;
    }

    if (method === 'DELETE') {
      if (!template) {
        sendJSON(res, 404, { error: '模板不存在' });
        return;
      }
      appData.templates = appData.templates.filter(t => t.id !== id);
      saveData(appData);
      sendJSON(res, 200, { message: '删除成功' });
      return;
    }
  }

  if (url.startsWith('/api/templates')) {
    const query = parseQueryString(url);

    if (method === 'GET') {
      let templates = [...(appData.templates || [])];
      if (query.type && query.type !== 'all') {
        templates = templates.filter(t => t.type === query.type);
      }
      templates.sort((a, b) => b.id - a.id);
      sendJSON(res, 200, templates);
      return;
    }

    if (method === 'POST') {
      try {
        const body = await parseBody(req);
        const { name, type, default_duration, exercise_description = '', notes = '' } = body;

        if (!name || !type || !default_duration) {
          sendJSON(res, 400, { error: '缺少必填字段' });
          return;
        }

        const newTemplate = {
          id: getNextTemplateId(),
          name,
          type,
          default_duration,
          exercise_description,
          notes,
          created_at: new Date().toISOString()
        };

        if (!appData.templates) appData.templates = [];
        appData.templates.push(newTemplate);
        saveData(appData);
        sendJSON(res, 201, newTemplate);
      } catch (err) {
        sendJSON(res, 400, { error: '请求体格式错误' });
      }
      return;
    }
  }

  sendJSON(res, 404, { error: '接口不存在' });
});

server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
