const API_BASE = '/api';

let currentPlans = [];
let deleteTargetId = null;

const elements = {
  weekTotal: document.getElementById('week-total'),
  weekCompleted: document.getElementById('week-completed'),
  weekDuration: document.getElementById('week-duration'),
  filterType: document.getElementById('filter-type'),
  filterDate: document.getElementById('filter-date'),
  filterCompleted: document.getElementById('filter-completed'),
  btnReset: document.getElementById('btn-reset'),
  btnAdd: document.getElementById('btn-add'),
  plansList: document.getElementById('plans-list'),
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
  confirmModal: document.getElementById('confirm-modal'),
  btnCancelDelete: document.getElementById('btn-cancel-delete'),
  btnConfirmDelete: document.getElementById('btn-confirm-delete')
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

async function fetchPlans() {
  const params = new URLSearchParams();
  
  if (elements.filterType.value && elements.filterType.value !== 'all') {
    params.append('type', elements.filterType.value);
  }
  if (elements.filterDate.value) {
    params.append('date', elements.filterDate.value);
  }
  if (elements.filterCompleted.value && elements.filterCompleted.value !== 'all') {
    params.append('completed', elements.filterCompleted.value);
  }

  try {
    const res = await fetch(`${API_BASE}/plans?${params.toString()}`);
    currentPlans = await res.json();
    renderPlans();
  } catch (err) {
    console.error('获取计划列表失败:', err);
  }
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
        <button class="btn btn-secondary" onclick="editPlan(${plan.id})">编辑</button>
        <button class="btn btn-danger" onclick="showDeleteConfirm(${plan.id})">删除</button>
      </div>
    </div>
  `).join('');
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

function openAddModal() {
  elements.modalTitle.textContent = '新增运动计划';
  elements.planId.value = '';
  elements.planName.value = '';
  elements.planType.value = '';
  elements.planDate.value = getTodayStr();
  elements.planDuration.value = '';
  elements.planCompleted.checked = false;
  elements.planNotes.value = '';
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

function showDeleteConfirm(id) {
  deleteTargetId = id;
  elements.confirmModal.classList.add('show');
}

function hideDeleteConfirm() {
  deleteTargetId = null;
  elements.confirmModal.classList.remove('show');
}

async function confirmDelete() {
  if (!deleteTargetId) return;
  
  try {
    const res = await fetch(`${API_BASE}/plans/${deleteTargetId}`, {
      method: 'DELETE'
    });
    
    if (res.ok) {
      hideDeleteConfirm();
      await fetchPlans();
      await fetchStats();
      await fetchTypes();
    }
  } catch (err) {
    console.error('删除计划失败:', err);
    alert('删除失败，请稍后重试');
  }
}

function resetFilters() {
  elements.filterType.value = 'all';
  elements.filterDate.value = '';
  elements.filterCompleted.value = 'all';
  fetchPlans();
}

function initEventListeners() {
  elements.filterType.addEventListener('change', fetchPlans);
  elements.filterDate.addEventListener('change', fetchPlans);
  elements.filterCompleted.addEventListener('change', fetchPlans);
  elements.btnReset.addEventListener('click', resetFilters);
  elements.btnAdd.addEventListener('click', openAddModal);
  elements.btnClose.addEventListener('click', closeModal);
  elements.btnCancel.addEventListener('click', closeModal);
  elements.planForm.addEventListener('submit', savePlan);
  elements.btnCancelDelete.addEventListener('click', hideDeleteConfirm);
  elements.btnConfirmDelete.addEventListener('click', confirmDelete);

  elements.modal.addEventListener('click', (e) => {
    if (e.target === elements.modal) {
      closeModal();
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
      } else if (elements.modal.classList.contains('show')) {
        closeModal();
      }
    }
  });
}

async function init() {
  initEventListeners();
  await fetchStats();
  await fetchTypes();
  await fetchPlans();
}

window.toggleComplete = toggleComplete;
window.editPlan = editPlan;
window.showDeleteConfirm = showDeleteConfirm;

init();
