const API_BASE = '/api';

let currentPlans = [];
let currentTemplates = [];
let currentPlanDetail = null;
let deleteTargetId = null;
let deleteTargetType = null;
let currentTab = 'plans';

const elements = {
  weekTotal: document.getElementById('week-total'),
  weekCompleted: document.getElementById('week-completed'),
  weekDuration: document.getElementById('week-duration'),
  monthRecords: document.getElementById('month-records'),
  monthDuration: document.getElementById('month-duration'),
  filterType: document.getElementById('filter-type'),
  filterDate: document.getElementById('filter-date'),
  filterCompleted: document.getElementById('filter-completed'),
  btnWeek: document.getElementById('btn-week'),
  btnReset: document.getElementById('btn-reset'),
  btnAdd: document.getElementById('btn-add'),
  plansList: document.getElementById('plans-list'),
  plansCount: document.getElementById('plans-count'),
  emptyState: document.getElementById('empty-state'),
  modal: document.getElementById('modal'),
  modalTitle: document.getElementById('modal-title'),
  btnClose: document.getElementById('btn-close'),
  btnCancel: document.getElementById('btn-cancel'),
  planForm: document.getElementById('plan-form'),
  planId: document.getElementById('plan-id'),
  planName: document.getElementById('plan-name'),
  planType: document.getElementById('plan-type'),
  planDate: document.getElementById('plan-date'),
  planDuration: document.getElementById('plan-duration'),
  planCompleted: document.getElementById('plan-completed'),
  planNotes: document.getElementById('plan-notes'),
  planTemplate: document.getElementById('plan-template'),
  templateSelectorGroup: document.getElementById('template-selector-group'),
  recordModal: document.getElementById('record-modal'),
  recordModalTitle: document.getElementById('record-modal-title'),
  btnRecordClose: document.getElementById('btn-record-close'),
  btnRecordCancel: document.getElementById('btn-record-cancel'),
  recordForm: document.getElementById('record-form'),
  recordId: document.getElementById('record-id'),
  recordPlanId: document.getElementById('record-plan-id'),
  recordDate: document.getElementById('record-date'),
  recordDuration: document.getElementById('record-duration'),
  recordCalories: document.getElementById('record-calories'),
  recordFeeling: document.getElementById('record-feeling'),
  confirmModal: document.getElementById('confirm-modal'),
  confirmMessage: document.getElementById('confirm-message'),
  btnCancelDelete: document.getElementById('btn-cancel-delete'),
  btnConfirmDelete: document.getElementById('btn-confirm-delete'),
  detailSection: document.getElementById('detail-section'),
  detailTitle: document.getElementById('detail-title'),
  detailContent: document.getElementById('detail-content'),
  btnBack: document.getElementById('btn-back'),
  plansSection: document.querySelector('.plans-section'),
  actionSection: document.querySelector('.action-section'),
  filterSection: document.querySelector('.filter-section'),
  navTabs: document.querySelectorAll('.nav-tab'),
  tabPlans: document.getElementById('tab-plans'),
  tabTemplates: document.getElementById('tab-templates'),
  btnAddTemplate: document.getElementById('btn-add-template'),
  templatesList: document.getElementById('templates-list'),
  templatesCount: document.getElementById('templates-count'),
  templatesEmptyState: document.getElementById('templates-empty-state'),
  templateModal: document.getElementById('template-modal'),
  templateModalTitle: document.getElementById('template-modal-title'),
  btnTemplateClose: document.getElementById('btn-template-close'),
  btnTemplateCancel: document.getElementById('btn-template-cancel'),
  templateForm: document.getElementById('template-form'),
  templateId: document.getElementById('template-id'),
  templateName: document.getElementById('template-name'),
  templateType: document.getElementById('template-type'),
  templateDuration: document.getElementById('template-duration'),
  templateDescription: document.getElementById('template-description'),
  templateNotes: document.getElementById('template-notes')
};

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayStr() {
  return formatDate(new Date());
}

function getWeekRange() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    start: formatDate(monday),
    end: formatDate(sunday)
  };
}

function switchTab(tabName) {
  currentTab = tabName;
  elements.navTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  elements.tabPlans.classList.toggle('active', tabName === 'plans');
  elements.tabTemplates.classList.toggle('active', tabName === 'templates');
  elements.detailSection.style.display = 'none';
  if (tabName === 'templates') {
    fetchTemplates();
  }
}

async function fetchStats() {
  try {
    const res = await fetch(`${API_BASE}/plans/stats`);
    const stats = await res.json();
    elements.weekTotal.textContent = stats.totalPlans;
    elements.weekCompleted.textContent = stats.completedPlans;
    elements.weekDuration.textContent = stats.totalDuration;
  } catch (err) {
    console.error('获取统计数据失败:', err);
  }
}

async function fetchMonthlyStats() {
  try {
    const res = await fetch(`${API_BASE}/plans/monthly-stats`);
    const stats = await res.json();
    elements.monthRecords.textContent = stats.totalRecords;
    elements.monthDuration.textContent = stats.totalDuration;
  } catch (err) {
    console.error('获取月度统计数据失败:', err);
  }
}

async function fetchTypes() {
  try {
    const res = await fetch(`${API_BASE}/plans/types`);
    const types = await res.json();

    const currentValue = elements.filterType.value;

    elements.filterType.innerHTML = '<option value="all">全部类型</option>';
    types.forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type;
      elements.filterType.appendChild(option);
    });

    if (types.includes(currentValue)) {
      elements.filterType.value = currentValue;
    }
  } catch (err) {
    console.error('获取类型列表失败:', err);
  }
}

let currentFilters = {
  type: 'all',
  date: '',
  completed: 'all',
  startDate: '',
  endDate: ''
};

async function fetchPlans() {
  const params = new URLSearchParams();

  if (currentFilters.type && currentFilters.type !== 'all') {
    params.append('type', currentFilters.type);
  }
  if (currentFilters.date) {
    params.append('date', currentFilters.date);
  }
  if (currentFilters.startDate) {
    params.append('startDate', currentFilters.startDate);
  }
  if (currentFilters.endDate) {
    params.append('endDate', currentFilters.endDate);
  }
  if (currentFilters.completed && currentFilters.completed !== 'all') {
    params.append('completed', currentFilters.completed);
  }

  try {
    const res = await fetch(`${API_BASE}/plans?${params.toString()}`);
    currentPlans = await res.json();
    renderPlans();
    updatePlansCount();
  } catch (err) {
    console.error('获取计划列表失败:', err);
  }
}

function updatePlansCount() {
  const hasFilters = currentFilters.type !== 'all' || currentFilters.date ||
                     currentFilters.completed !== 'all' || currentFilters.startDate;
  const label = hasFilters ? '筛选结果' : '全部';
  elements.plansCount.textContent = `${label}: ${currentPlans.length} 条`;
}

function renderPlans() {
  if (currentPlans.length === 0) {
    elements.plansList.innerHTML = '';
    elements.emptyState.style.display = 'block';
    return;
  }

  elements.emptyState.style.display = 'none';

  elements.plansList.innerHTML = currentPlans.map(plan => `
    <div class="plan-item ${plan.completed ? 'completed' : ''}" data-id="${plan.id}">
      <input type="checkbox" class="plan-checkbox" ${plan.completed ? 'checked' : ''} onclick="toggleComplete(${plan.id})">
      <div class="plan-content">
        <div class="plan-header">
          <span class="plan-name">${escapeHtml(plan.name)}</span>
          <span class="plan-type ${escapeHtml(plan.type)}">${escapeHtml(plan.type)}</span>
        </div>
        <div class="plan-meta">
          <span>📅 ${plan.plan_date}</span>
          <span>⏱️ ${plan.duration} 分钟</span>
          <span>${plan.completed ? '✅ 已完成' : '⏳ 未完成'}</span>
        </div>
        ${plan.notes ? `<div class="plan-notes">${escapeHtml(plan.notes)}</div>` : ''}
      </div>
      <div class="plan-actions">
        <button class="btn btn-outline" onclick="viewPlanDetail(${plan.id})">详情</button>
        <button class="btn btn-secondary" onclick="editPlan(${plan.id})">编辑</button>
        <button class="btn btn-danger" onclick="showDeleteConfirm(${plan.id}, 'plan')">删除</button>
      </div>
    </div>
  `).join('');
}

async function fetchTemplates() {
  try {
    const res = await fetch(`${API_BASE}/templates`);
    currentTemplates = await res.json();
    renderTemplates();
    updateTemplatesCount();
  } catch (err) {
    console.error('获取模板列表失败:', err);
  }
}

function updateTemplatesCount() {
  elements.templatesCount.textContent = `全部: ${currentTemplates.length} 条`;
}

function renderTemplates() {
  if (currentTemplates.length === 0) {
    elements.templatesList.innerHTML = '';
    elements.templatesEmptyState.style.display = 'block';
    return;
  }

  elements.templatesEmptyState.style.display = 'none';

  elements.templatesList.innerHTML = currentTemplates.map(template => `
    <div class="template-item" data-id="${template.id}">
      <div class="template-content">
        <div class="template-header">
          <span class="template-name">${escapeHtml(template.name)}</span>
          <span class="plan-type ${escapeHtml(template.type)}">${escapeHtml(template.type)}</span>
        </div>
        <div class="template-meta">
          <span>⏱️ 默认 ${template.default_duration} 分钟</span>
        </div>
        ${template.exercise_description ? `<div class="template-desc"><strong>动作说明：</strong>${escapeHtml(template.exercise_description)}</div>` : ''}
        ${template.notes ? `<div class="template-notes"><strong>备注：</strong>${escapeHtml(template.notes)}</div>` : ''}
      </div>
      <div class="template-actions">
        <button class="btn btn-success" onclick="applyTemplate(${template.id})">📋 套用创建计划</button>
        <button class="btn btn-secondary" onclick="editTemplate(${template.id})">编辑</button>
        <button class="btn btn-danger" onclick="showDeleteConfirm(${template.id}, 'template')">删除</button>
      </div>
    </div>
  `).join('');
}

async function populateTemplateSelector() {
  try {
    const res = await fetch(`${API_BASE}/templates`);
    const templates = await res.json();
    elements.planTemplate.innerHTML = '<option value="">-- 不使用模板，手动填写 --</option>';
    templates.forEach(template => {
      const option = document.createElement('option');
      option.value = template.id;
      option.textContent = `${template.name} (${template.type} · ${template.default_duration}分钟)`;
      elements.planTemplate.appendChild(option);
    });
  } catch (err) {
    console.error('获取模板列表失败:', err);
  }
}

function applyTemplateData(template) {
  elements.planName.value = template.name;
  elements.planType.value = template.type;
  elements.planDuration.value = template.default_duration;
  let combinedNotes = '';
  if (template.exercise_description) {
    combinedNotes += `【动作说明】\n${template.exercise_description}`;
  }
  if (template.notes) {
    if (combinedNotes) combinedNotes += '\n\n';
    combinedNotes += `【备注】\n${template.notes}`;
  }
  elements.planNotes.value = combinedNotes;
}

async function onTemplateSelected(e) {
  const templateId = e.target.value;
  if (!templateId) return;
  try {
    const res = await fetch(`${API_BASE}/templates/${templateId}`);
    const template = await res.json();
    if (template) {
      applyTemplateData(template);
    }
  } catch (err) {
    console.error('获取模板详情失败:', err);
  }
}

async function applyTemplate(templateId) {
  try {
    const res = await fetch(`${API_BASE}/templates/${templateId}`);
    const template = await res.json();
    if (template) {
      switchTab('plans');
      openAddModal();
      applyTemplateData(template);
    }
  } catch (err) {
    console.error('套用模板失败:', err);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function toggleComplete(id) {
  try {
    const res = await fetch(`${API_BASE}/plans/${id}/toggle`, {
      method: 'PATCH'
    });
    if (res.ok) {
      await fetchPlans();
      await fetchStats();
    }
  } catch (err) {
    console.error('切换完成状态失败:', err);
  }
}

async function openAddModal() {
  elements.modalTitle.textContent = '新增运动计划';
  elements.planId.value = '';
  elements.planName.value = '';
  elements.planType.value = '';
  elements.planDate.value = getTodayStr();
  elements.planDuration.value = '';
  elements.planCompleted.checked = false;
  elements.planNotes.value = '';
  elements.templateSelectorGroup.style.display = 'block';
  elements.planTemplate.value = '';
  await populateTemplateSelector();
  elements.modal.classList.add('show');
}

async function editPlan(id) {
  try {
    const res = await fetch(`${API_BASE}/plans/${id}`);
    const plan = await res.json();

    elements.modalTitle.textContent = '编辑运动计划';
    elements.planId.value = plan.id;
    elements.planName.value = plan.name;
    elements.planType.value = plan.type;
    elements.planDate.value = plan.plan_date;
    elements.planDuration.value = plan.duration;
    elements.planCompleted.checked = !!plan.completed;
    elements.planNotes.value = plan.notes || '';
    elements.templateSelectorGroup.style.display = 'none';
    elements.modal.classList.add('show');
  } catch (err) {
    console.error('获取计划详情失败:', err);
  }
}

function closeModal() {
  elements.modal.classList.remove('show');
}

async function savePlan(e) {
  e.preventDefault();

  const planData = {
    name: elements.planName.value.trim(),
    type: elements.planType.value,
    plan_date: elements.planDate.value,
    duration: parseInt(elements.planDuration.value),
    completed: elements.planCompleted.checked,
    notes: elements.planNotes.value.trim()
  };

  const id = elements.planId.value;

  try {
    let res;
    if (id) {
      res = await fetch(`${API_BASE}/plans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData)
      });
    } else {
      res = await fetch(`${API_BASE}/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData)
      });
    }

    if (res.ok) {
      closeModal();
      await fetchPlans();
      await fetchStats();
      await fetchTypes();
    } else {
      const err = await res.json();
      alert(err.error || '保存失败');
    }
  } catch (err) {
    console.error('保存计划失败:', err);
    alert('保存失败，请稍后重试');
  }
}

function openAddTemplateModal() {
  elements.templateModalTitle.textContent = '新增训练模板';
  elements.templateId.value = '';
  elements.templateName.value = '';
  elements.templateType.value = '';
  elements.templateDuration.value = '';
  elements.templateDescription.value = '';
  elements.templateNotes.value = '';
  elements.templateModal.classList.add('show');
}

async function editTemplate(id) {
  try {
    const res = await fetch(`${API_BASE}/templates/${id}`);
    const template = await res.json();

    elements.templateModalTitle.textContent = '编辑训练模板';
    elements.templateId.value = template.id;
    elements.templateName.value = template.name;
    elements.templateType.value = template.type;
    elements.templateDuration.value = template.default_duration;
    elements.templateDescription.value = template.exercise_description || '';
    elements.templateNotes.value = template.notes || '';
    elements.templateModal.classList.add('show');
  } catch (err) {
    console.error('获取模板详情失败:', err);
  }
}

function closeTemplateModal() {
  elements.templateModal.classList.remove('show');
}

async function saveTemplate(e) {
  e.preventDefault();

  const templateData = {
    name: elements.templateName.value.trim(),
    type: elements.templateType.value,
    default_duration: parseInt(elements.templateDuration.value),
    exercise_description: elements.templateDescription.value.trim(),
    notes: elements.templateNotes.value.trim()
  };

  const id = elements.templateId.value;

  try {
    let res;
    if (id) {
      res = await fetch(`${API_BASE}/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      });
    } else {
      res = await fetch(`${API_BASE}/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      });
    }

    if (res.ok) {
      closeTemplateModal();
      await fetchTemplates();
    } else {
      const err = await res.json();
      alert(err.error || '保存失败');
    }
  } catch (err) {
    console.error('保存模板失败:', err);
    alert('保存失败，请稍后重试');
  }
}

function showDeleteConfirm(id, type) {
  deleteTargetId = id;
  deleteTargetType = type;
  if (type === 'plan') {
    elements.confirmMessage.textContent = '确定要删除这个运动计划吗？关联的训练记录也会被删除。';
  } else if (type === 'template') {
    elements.confirmMessage.textContent = '确定要删除这个训练模板吗？';
  } else {
    elements.confirmMessage.textContent = '确定要删除这条训练记录吗？';
  }
  elements.confirmModal.classList.add('show');
}

function hideDeleteConfirm() {
  deleteTargetId = null;
  deleteTargetType = null;
  elements.confirmModal.classList.remove('show');
}

async function confirmDelete() {
  if (!deleteTargetId) return;

  try {
    let res;
    if (deleteTargetType === 'plan') {
      res = await fetch(`${API_BASE}/plans/${deleteTargetId}`, {
        method: 'DELETE'
      });
    } else if (deleteTargetType === 'template') {
      res = await fetch(`${API_BASE}/templates/${deleteTargetId}`, {
        method: 'DELETE'
      });
    } else {
      res = await fetch(`${API_BASE}/records/${deleteTargetId}`, {
        method: 'DELETE'
      });
    }

    if (res.ok) {
      hideDeleteConfirm();
      if (deleteTargetType === 'plan') {
        await fetchPlans();
        await fetchStats();
        await fetchTypes();
      } else if (deleteTargetType === 'template') {
        await fetchTemplates();
      } else {
        await fetchMonthlyStats();
        if (currentPlanDetail) {
          await viewPlanDetail(currentPlanDetail.id);
        }
      }
    }
  } catch (err) {
    console.error('删除失败:', err);
    alert('删除失败，请稍后重试');
  }
}

function resetFilters() {
  currentFilters = {
    type: 'all',
    date: '',
    completed: 'all',
    startDate: '',
    endDate: ''
  };
  elements.filterType.value = 'all';
  elements.filterDate.value = '';
  elements.filterCompleted.value = 'all';
  fetchPlans();
}

function filterByWeek() {
  const weekRange = getWeekRange();
  currentFilters = {
    type: 'all',
    date: '',
    completed: 'all',
    startDate: weekRange.start,
    endDate: weekRange.end
  };
  elements.filterType.value = 'all';
  elements.filterDate.value = '';
  elements.filterCompleted.value = 'all';
  fetchPlans();
}

function showList() {
  elements.detailSection.style.display = 'none';
  if (currentTab === 'plans') {
    elements.tabPlans.classList.add('active');
  } else {
    elements.tabTemplates.classList.add('active');
  }
  currentPlanDetail = null;
}

async function viewPlanDetail(id) {
  try {
    const res = await fetch(`${API_BASE}/plans/${id}`);
    const plan = await res.json();
    currentPlanDetail = plan;
    renderPlanDetail(plan);

    elements.tabPlans.classList.remove('active');
    elements.tabTemplates.classList.remove('active');
    elements.detailSection.style.display = 'block';
  } catch (err) {
    console.error('获取计划详情失败:', err);
    alert('获取计划详情失败');
  }
}

function renderPlanDetail(plan) {
  elements.detailTitle.textContent = plan.name;

  const records = plan.records || [];

  elements.detailContent.innerHTML = `
    <div class="detail-info">
      <div class="detail-info-row">
        <span class="detail-label">训练类型</span>
        <span class="plan-type ${escapeHtml(plan.type)}">${escapeHtml(plan.type)}</span>
      </div>
      <div class="detail-info-row">
        <span class="detail-label">计划日期</span>
        <span>📅 ${plan.plan_date}</span>
      </div>
      <div class="detail-info-row">
        <span class="detail-label">预计时长</span>
        <span>⏱️ ${plan.duration} 分钟</span>
      </div>
      <div class="detail-info-row">
        <span class="detail-label">完成状态</span>
        <span>${plan.completed ? '✅ 已完成' : '⏳ 未完成'}</span>
      </div>
      ${plan.notes ? `
      <div class="detail-info-row">
        <span class="detail-label">计划备注</span>
        <span class="detail-notes">${escapeHtml(plan.notes)}</span>
      </div>
      ` : ''}
    </div>

    <div class="records-section">
      <div class="records-header">
        <h3>训练记录 (${records.length})</h3>
        <button class="btn btn-primary" onclick="openAddRecordModal()">+ 添加记录</button>
      </div>
      ${records.length === 0 ? `
        <div class="empty-state">
          <p>暂无训练记录，点击"添加记录"开始记录实际训练情况</p>
        </div>
      ` : `
        <div class="records-list">
          ${records.map(record => `
            <div class="record-item" data-id="${record.id}">
              <div class="record-content">
                <div class="record-meta">
                  <span>📅 ${record.training_date}</span>
                  <span>⏱️ ${record.actual_duration} 分钟</span>
                  ${record.calories_burned ? `<span>🔥 ${record.calories_burned} 千卡</span>` : ''}
                </div>
                ${record.feeling_notes ? `<div class="record-notes">${escapeHtml(record.feeling_notes)}</div>` : ''}
              </div>
              <div class="record-actions">
                <button class="btn btn-secondary" onclick="editRecord(${record.id})">编辑</button>
                <button class="btn btn-danger" onclick="showDeleteConfirm(${record.id}, 'record')">删除</button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

function openAddRecordModal() {
  if (!currentPlanDetail) return;
  elements.recordModalTitle.textContent = '新增训练记录';
  elements.recordId.value = '';
  elements.recordPlanId.value = currentPlanDetail.id;
  elements.recordDate.value = getTodayStr();
  elements.recordDuration.value = '';
  elements.recordCalories.value = '';
  elements.recordFeeling.value = '';
  elements.recordModal.classList.add('show');
}

async function editRecord(id) {
  try {
    const res = await fetch(`${API_BASE}/records/${id}`);
    const record = await res.json();

    elements.recordModalTitle.textContent = '编辑训练记录';
    elements.recordId.value = record.id;
    elements.recordPlanId.value = record.plan_id || '';
    elements.recordDate.value = record.training_date;
    elements.recordDuration.value = record.actual_duration;
    elements.recordCalories.value = record.calories_burned || '';
    elements.recordFeeling.value = record.feeling_notes || '';
    elements.recordModal.classList.add('show');
  } catch (err) {
    console.error('获取训练记录失败:', err);
    alert('获取训练记录失败');
  }
}

function closeRecordModal() {
  elements.recordModal.classList.remove('show');
}

async function saveRecord(e) {
  e.preventDefault();

  const recordData = {
    plan_id: elements.recordPlanId.value ? parseInt(elements.recordPlanId.value) : null,
    training_date: elements.recordDate.value,
    actual_duration: parseInt(elements.recordDuration.value),
    calories_burned: elements.recordCalories.value ? parseInt(elements.recordCalories.value) : 0,
    feeling_notes: elements.recordFeeling.value.trim()
  };

  const id = elements.recordId.value;

  try {
    let res;
    if (id) {
      res = await fetch(`${API_BASE}/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordData)
      });
    } else {
      res = await fetch(`${API_BASE}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordData)
      });
    }

    if (res.ok) {
      closeRecordModal();
      await fetchMonthlyStats();
      if (currentPlanDetail) {
        await viewPlanDetail(currentPlanDetail.id);
      }
    } else {
      const err = await res.json();
      alert(err.error || '保存失败');
    }
  } catch (err) {
    console.error('保存训练记录失败:', err);
    alert('保存失败，请稍后重试');
  }
}

function initEventListeners() {
  elements.navTabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  elements.filterType.addEventListener('change', () => {
    currentFilters.type = elements.filterType.value;
    fetchPlans();
  });
  elements.filterDate.addEventListener('change', () => {
    currentFilters.date = elements.filterDate.value;
    currentFilters.startDate = '';
    currentFilters.endDate = '';
    fetchPlans();
  });
  elements.filterCompleted.addEventListener('change', () => {
    currentFilters.completed = elements.filterCompleted.value;
    fetchPlans();
  });
  elements.btnWeek.addEventListener('click', filterByWeek);
  elements.btnReset.addEventListener('click', resetFilters);
  elements.btnAdd.addEventListener('click', openAddModal);
  elements.btnClose.addEventListener('click', closeModal);
  elements.btnCancel.addEventListener('click', closeModal);
  elements.planForm.addEventListener('submit', savePlan);
  elements.planTemplate.addEventListener('change', onTemplateSelected);
  elements.btnRecordClose.addEventListener('click', closeRecordModal);
  elements.btnRecordCancel.addEventListener('click', closeRecordModal);
  elements.recordForm.addEventListener('submit', saveRecord);
  elements.btnCancelDelete.addEventListener('click', hideDeleteConfirm);
  elements.btnConfirmDelete.addEventListener('click', confirmDelete);
  elements.btnBack.addEventListener('click', showList);
  elements.btnAddTemplate.addEventListener('click', openAddTemplateModal);
  elements.btnTemplateClose.addEventListener('click', closeTemplateModal);
  elements.btnTemplateCancel.addEventListener('click', closeTemplateModal);
  elements.templateForm.addEventListener('submit', saveTemplate);

  elements.modal.addEventListener('click', (e) => {
    if (e.target === elements.modal) {
      closeModal();
    }
  });

  elements.recordModal.addEventListener('click', (e) => {
    if (e.target === elements.recordModal) {
      closeRecordModal();
    }
  });

  elements.templateModal.addEventListener('click', (e) => {
    if (e.target === elements.templateModal) {
      closeTemplateModal();
    }
  });

  elements.confirmModal.addEventListener('click', (e) => {
    if (e.target === elements.confirmModal) {
      hideDeleteConfirm();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (elements.confirmModal.classList.contains('show')) {
        hideDeleteConfirm();
      } else if (elements.templateModal.classList.contains('show')) {
        closeTemplateModal();
      } else if (elements.recordModal.classList.contains('show')) {
        closeRecordModal();
      } else if (elements.modal.classList.contains('show')) {
        closeModal();
      }
    }
  });
}

async function init() {
  initEventListeners();
  await fetchStats();
  await fetchMonthlyStats();
  await fetchTypes();
  await fetchPlans();
}

window.toggleComplete = toggleComplete;
window.editPlan = editPlan;
window.showDeleteConfirm = showDeleteConfirm;
window.viewPlanDetail = viewPlanDetail;
window.openAddRecordModal = openAddRecordModal;
window.editRecord = editRecord;
window.editTemplate = editTemplate;
window.applyTemplate = applyTemplate;

init();
