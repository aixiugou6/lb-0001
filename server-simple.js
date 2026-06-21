const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const DATA_FILE = path.join(__dirname, 'data.json');

const DEFAULT_DATA = {
  plans: []
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
      return d.toISOString().split('T')[0];
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
    saveData(data);
    console.log('已插入示例数据');
  }
  return data;
}

let appData = initSampleData();
let nextId = appData.plans.length > 0 ? Math.max(...appData.plans.map(p => p.id)) + 1 : 1;

function getNextId() {
  return nextId++;
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

  const formatDate = (d) => d.toISOString().split('T')[0];
  const weekStart = formatDate(monday);
  const weekEnd = formatDate(sunday);

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

  const planMatch = url.match(/^\/api\/plans\/(\d+)\/toggle$/);
  if (planMatch && method === 'PATCH') {
    const id = parseInt(planMatch[1]);
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
      sendJSON(res, 200, plan);
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
          id: getNextId(),
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

  sendJSON(res, 404, { error: '接口不存在' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
