const state = {
  tasks: [],
  currentFilter: 'all',
  currentPriority: 'all',
  searchQuery: '',
  theme: 'light',
  editingTaskId: null,
  taskToDeleteId: null,
  bootstrapModalDelete: null,
  bootstrapModalClear: null,
  bootstrapToast: null
};

const STORAGE_KEYS = {
  TASKS: 'dailyTaskPlannerTasks',
  THEME: 'dailyTaskPlannerTheme'
};

const PRIORITY_ORDER = {
  High: 1,
  Medium: 2,
  Low: 3
};

const elements = {
  html: document.documentElement,
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  themeIcon: document.getElementById('themeIcon'),
  headerDateText: document.getElementById('headerDateText'),
  welcomeDayOfWeek: document.getElementById('welcomeDayOfWeek'),
  greetingTitle: document.getElementById('greetingTitle'),
  calendarMonthYear: document.getElementById('calendarMonthYear'),
  calendarDayNumber: document.getElementById('calendarDayNumber'),
  calendarFullDate: document.getElementById('calendarFullDate'),

  statTotalTasks: document.getElementById('statTotalTasks'),
  statPendingTasks: document.getElementById('statPendingTasks'),
  statCompletedTasks: document.getElementById('statCompletedTasks'),
  statProgressPct: document.getElementById('statProgressPct'),
  progressBarFill: document.getElementById('progressBarFill'),
  progressPercentageText: document.getElementById('progressPercentageText'),
  productivityMotivationMessage: document.getElementById('productivityMotivationMessage'),
  progressRatioDisplay: document.getElementById('progressRatioDisplay'),

  addTaskForm: document.getElementById('addTaskForm'),
  taskTitleInput: document.getElementById('taskTitleInput'),
  taskPrioritySelect: document.getElementById('taskPrioritySelect'),
  taskCategorySelect: document.getElementById('taskCategorySelect'),
  taskDueTimeInput: document.getElementById('taskDueTimeInput'),

  searchInput: document.getElementById('searchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  statusFilterGroup: document.getElementById('statusFilterGroup'),
  priorityFilterSelect: document.getElementById('priorityFilterSelect'),
  clearCompletedBtn: document.getElementById('clearCompletedBtn'),

  taskListContainer: document.getElementById('taskListContainer'),
  taskListCountBadge: document.getElementById('taskListCountBadge'),
  filterStatusIndicator: document.getElementById('filterStatusIndicator'),
  emptyStateContainer: document.getElementById('emptyStateContainer'),
  emptyStateIcon: document.getElementById('emptyStateIcon'),
  emptyStateTitle: document.getElementById('emptyStateTitle'),
  emptyStateDesc: document.getElementById('emptyStateDesc'),
  emptyStateActionContainer: document.getElementById('emptyStateActionContainer'),

  deleteTaskModal: document.getElementById('deleteTaskModal'),
  deleteTaskTitlePreview: document.getElementById('deleteTaskTitlePreview'),
  confirmDeleteTaskBtn: document.getElementById('confirmDeleteTaskBtn'),
  clearCompletedModal: document.getElementById('clearCompletedModal'),
  completedCountToDelete: document.getElementById('completedCountToDelete'),
  confirmClearCompletedBtn: document.getElementById('confirmClearCompletedBtn'),

  appToast: document.getElementById('appToast'),
  toastIcon: document.getElementById('toastIcon'),
  toastMessage: document.getElementById('toastMessage')
};

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  if (hours === undefined || minutes === undefined) return timeStr;
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const formattedHours = h % 12 || 12;
  return `${formattedHours}:${minutes} ${ampm}`;
}

function initBootstrapComponents() {
  if (typeof bootstrap !== 'undefined') {
    if (elements.deleteTaskModal) {
      state.bootstrapModalDelete = new bootstrap.Modal(elements.deleteTaskModal);
    }
    if (elements.clearCompletedModal) {
      state.bootstrapModalClear = new bootstrap.Modal(elements.clearCompletedModal);
    }
    if (elements.appToast) {
      state.bootstrapToast = new bootstrap.Toast(elements.appToast, { delay: 3500 });
    }
  }
}

function showToast(message, type = 'info') {
  if (!elements.appToast || !state.bootstrapToast) return;

  const typeConfig = {
    success: { icon: 'bi-check-circle-fill text-success', textClass: 'text-success-emphasis' },
    warning: { icon: 'bi-exclamation-triangle-fill text-warning', textClass: 'text-warning-emphasis' },
    danger: { icon: 'bi-x-circle-fill text-danger', textClass: 'text-danger-emphasis' },
    info: { icon: 'bi-info-circle-fill text-primary', textClass: 'text-primary-emphasis' }
  };

  const config = typeConfig[type] || typeConfig.info;

  if (elements.toastIcon) {
    elements.toastIcon.className = `${config.icon} fs-5`;
  }
  if (elements.toastMessage) {
    elements.toastMessage.textContent = message;
    elements.toastMessage.className = `fw-medium ${config.textClass}`;
  }

  state.bootstrapToast.show();
}

function updateDate() {
  const now = new Date();

  const headerDateString = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  if (elements.headerDateText) {
    elements.headerDateText.textContent = headerDateString;
  }

  const weekdayLong = now.toLocaleDateString('en-US', { weekday: 'long' });
  if (elements.welcomeDayOfWeek) {
    elements.welcomeDayOfWeek.textContent = weekdayLong.toUpperCase();
  }

  const monthYearString = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  if (elements.calendarMonthYear) {
    elements.calendarMonthYear.textContent = monthYearString.toUpperCase();
  }

  if (elements.calendarDayNumber) {
    elements.calendarDayNumber.textContent = String(now.getDate());
  }

  const fullDateString = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  if (elements.calendarFullDate) {
    elements.calendarFullDate.textContent = fullDateString;
  }
}

function updateGreeting() {
  const hour = new Date().getHours();
  let greetingText = 'Good Morning! 👋';

  if (hour >= 12 && hour < 17) {
    greetingText = 'Good Afternoon! 👋';
  } else if (hour >= 17) {
    greetingText = 'Good Evening! 👋';
  }

  if (elements.greetingTitle) {
    elements.greetingTitle.textContent = greetingText;
  }
}

function loadTasks() {
  try {
    const serializedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!serializedTasks) return [];
    const parsed = JSON.parse(serializedTasks);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error loading tasks from LocalStorage:', error);
    showToast('Failed to load saved tasks. Resetting to empty list.', 'danger');
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(state.tasks));
  } catch (error) {
    console.error('Error saving tasks to LocalStorage:', error);
    showToast('Unable to persist tasks. Storage might be full.', 'danger');
  }
}

function loadTheme() {
  try {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  } catch (e) {
    return 'light';
  }
}

function saveTheme(theme) {
  state.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (e) {
    console.error('Error saving theme to LocalStorage:', e);
  }

  if (elements.html) {
    elements.html.setAttribute('data-bs-theme', theme);
  }

  if (elements.themeIcon) {
    if (theme === 'dark') {
      elements.themeIcon.className = 'bi bi-sun-fill text-warning';
    } else {
      elements.themeIcon.className = 'bi bi-moon-stars text-secondary';
    }
  }
}

function addTask(e) {
  if (e) e.preventDefault();

  const titleRaw = elements.taskTitleInput.value;
  const title = titleRaw.trim();

  if (!title) {
    showToast('Please enter a task title before adding.', 'warning');
    elements.taskTitleInput.focus();
    return;
  }

  const priority = elements.taskPrioritySelect.value || 'Medium';
  const category = elements.taskCategorySelect.value || 'Work';
  const dueTime = elements.taskDueTimeInput.value || '';

  const newTask = {
    id: 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    title: title,
    completed: false,
    priority: priority,
    category: category,
    dueTime: dueTime,
    createdAt: new Date().toISOString()
  };

  state.tasks.unshift(newTask);
  saveTasks();

  elements.addTaskForm.reset();
  elements.taskPrioritySelect.value = 'Medium';
  elements.taskCategorySelect.value = 'Work';

  renderTasks();
  updateStatistics();
  showToast('Task added successfully!', 'success');
}

function toggleTask(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  task.completed = !task.completed;
  saveTasks();
  renderTasks();
  updateStatistics();

  const statusText = task.completed ? 'completed' : 'pending';
  showToast(`Task marked as ${statusText}.`, task.completed ? 'success' : 'info');
}

function openInlineEdit(taskId) {
  state.editingTaskId = taskId;
  renderTasks();

  const inlineInput = document.getElementById(`inline-edit-input-${taskId}`);
  if (inlineInput) {
    inlineInput.focus();
    inlineInput.select();
  }
}

function cancelInlineEdit() {
  state.editingTaskId = null;
  renderTasks();
}

function updateTask(taskId, newTitle) {
  const trimmed = newTitle ? newTitle.trim() : '';
  if (!trimmed) {
    showToast('Task title cannot be empty.', 'warning');
    const inlineInput = document.getElementById(`inline-edit-input-${taskId}`);
    if (inlineInput) inlineInput.focus();
    return;
  }

  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  task.title = trimmed;
  state.editingTaskId = null;
  saveTasks();
  renderTasks();
  showToast('Task updated successfully!', 'success');
}

function requestDeleteTask(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  state.taskToDeleteId = taskId;
  if (elements.deleteTaskTitlePreview) {
    elements.deleteTaskTitlePreview.textContent = task.title;
  }

  if (state.bootstrapModalDelete) {
    state.bootstrapModalDelete.show();
  } else {
    if (confirm(`Delete this task?\n"${task.title}"`)) {
      deleteTask(taskId);
    }
  }
}

function deleteTask(taskId) {
  const index = state.tasks.findIndex(t => t.id === taskId);
  if (index === -1) return;

  state.tasks.splice(index, 1);
  state.taskToDeleteId = null;
  if (state.editingTaskId === taskId) {
    state.editingTaskId = null;
  }

  saveTasks();
  renderTasks();
  updateStatistics();
  showToast('Task deleted successfully.', 'info');
}

function requestClearCompleted() {
  const completedCount = state.tasks.filter(t => t.completed).length;
  if (completedCount === 0) {
    showToast('No completed tasks to clear.', 'info');
    return;
  }

  if (elements.completedCountToDelete) {
    elements.completedCountToDelete.textContent = String(completedCount);
  }

  if (state.bootstrapModalClear) {
    state.bootstrapModalClear.show();
  } else {
    if (confirm(`Are you sure you want to clear ${completedCount} completed task(s)?`)) {
      clearCompleted();
    }
  }
}

function clearCompleted() {
  const initialCount = state.tasks.length;
  state.tasks = state.tasks.filter(t => !t.completed);
  const removedCount = initialCount - state.tasks.length;

  saveTasks();
  renderTasks();
  updateStatistics();
  showToast(`Cleared ${removedCount} completed task${removedCount > 1 ? 's' : ''}.`, 'success');
}

function filterTasks() {
  const query = state.searchQuery.toLowerCase().trim();

  return state.tasks.filter(task => {
    if (state.currentFilter === 'pending' && task.completed) return false;
    if (state.currentFilter === 'completed' && !task.completed) return false;

    if (state.currentPriority !== 'all' && task.priority !== state.currentPriority) {
      return false;
    }

    if (query) {
      const matchTitle = task.title.toLowerCase().includes(query);
      const matchCategory = task.category.toLowerCase().includes(query);
      if (!matchTitle && !matchCategory) return false;
    }

    return true;
  });
}

function sortTasks(taskList) {
  return [...taskList].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    if (!a.completed && !b.completed) {
      const pA = PRIORITY_ORDER[a.priority] || 2;
      const pB = PRIORITY_ORDER[b.priority] || 2;
      if (pA !== pB) return pA - pB;
    }

    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

function searchTasks(e) {
  state.searchQuery = e.target.value;

  if (elements.clearSearchBtn) {
    if (state.searchQuery.trim().length > 0) {
      elements.clearSearchBtn.classList.remove('d-none');
    } else {
      elements.clearSearchBtn.classList.add('d-none');
    }
  }

  renderTasks();
}

function renderTask(task) {
  const isEditing = state.editingTaskId === task.id;
  const isCompleted = task.completed;
  const priorityClass = `priority-${(task.priority || 'medium').toLowerCase()}`;
  const priorityBadgeClass = `badge-priority-${(task.priority || 'medium').toLowerCase()}`;

  if (isEditing) {
    return `
      <div class="task-item ${priorityClass} shadow-sm" id="task-card-${task.id}">
        <div class="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2">
          <div class="flex-grow-1">
            <label for="inline-edit-input-${task.id}" class="visually-hidden">Edit task title</label>
            <input 
              type="text" 
              class="form-control form-control-sm inline-edit-input" 
              id="inline-edit-input-${task.id}" 
              value="${escapeHtml(task.title)}" 
              maxlength="150"
              autocomplete="off"
            >
          </div>
          <div class="d-flex align-items-center justify-content-end gap-2 flex-shrink-0">
            <button 
              type="button" 
              class="btn btn-sm btn-success d-inline-flex align-items-center gap-1 save-inline-edit-btn" 
              data-id="${task.id}"
              aria-label="Save changes to task"
              title="Save changes (Enter)"
            >
              <i class="bi bi-check-lg" aria-hidden="true"></i>
              <span>Save</span>
            </button>
            <button 
              type="button" 
              class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 cancel-inline-edit-btn" 
              data-id="${task.id}"
              aria-label="Cancel editing task"
              title="Cancel (Esc)"
            >
              <i class="bi bi-x-lg" aria-hidden="true"></i>
              <span>Cancel</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  const categoryIconMap = {
    Personal: 'bi-person',
    Study: 'bi-book',
    Work: 'bi-briefcase',
    Health: 'bi-heart-pulse',
    Other: 'bi-folder'
  };
  const catIcon = categoryIconMap[task.category] || 'bi-tag';

  const timeBadge = task.dueTime ? `
    <span class="task-meta-tag bg-body-secondary text-secondary border" title="Due time">
      <i class="bi bi-clock" aria-hidden="true"></i>
      <span>${formatTime(task.dueTime)}</span>
    </span>
  ` : '';

  return `
    <div class="task-item ${priorityClass} ${isCompleted ? 'completed' : ''}" id="task-card-${task.id}">
      <div class="d-flex align-items-start align-items-sm-center justify-content-between flex-wrap gap-2">
        <div class="d-flex align-items-center flex-grow-1 min-w-0">
          <label class="task-checkbox-container mb-0" title="${isCompleted ? 'Mark task pending' : 'Mark task completed'}">
            <input 
              type="checkbox" 
              class="task-checkbox" 
              data-id="${task.id}" 
              ${isCompleted ? 'checked' : ''}
              aria-label="Mark task '${escapeHtml(task.title)}' as ${isCompleted ? 'pending' : 'complete'}"
            >
          </label>

          <div class="d-flex flex-column min-w-0">
            <span class="task-title text-break">${escapeHtml(task.title)}</span>
            
            <div class="d-flex flex-wrap align-items-center gap-1 mt-1">
              <span class="task-meta-tag badge-category">
                <i class="bi ${catIcon}" aria-hidden="true"></i>
                <span>${escapeHtml(task.category)}</span>
              </span>

              <span class="task-meta-tag ${priorityBadgeClass}">
                <i class="bi bi-flag-fill" aria-hidden="true"></i>
                <span>${escapeHtml(task.priority)}</span>
              </span>

              ${timeBadge}
            </div>
          </div>
        </div>

        <div class="task-actions d-flex align-items-center gap-1 ms-auto">
          <button 
            type="button" 
            class="task-action-btn edit-btn" 
            data-id="${task.id}" 
            aria-label="Edit task '${escapeHtml(task.title)}'"
            title="Edit task"
          >
            <i class="bi bi-pencil" aria-hidden="true"></i>
          </button>
          
          <button 
            type="button" 
            class="task-action-btn delete-btn" 
            data-id="${task.id}" 
            aria-label="Delete task '${escapeHtml(task.title)}'"
            title="Delete task"
          >
            <i class="bi bi-trash" aria-hidden="true"></i>
          </button>
        </div>

      </div>
    </div>
  `;
}

function showEmptyState(context) {
  if (!elements.emptyStateContainer) return;

  elements.emptyStateContainer.classList.remove('d-none');
  elements.emptyStateActionContainer.innerHTML = '';

  if (context === 'no-tasks') {
    elements.emptyStateIcon.className = 'bi bi-check2-circle text-primary display-5';
    elements.emptyStateTitle.textContent = 'No tasks yet';
    elements.emptyStateDesc.textContent = 'Your day is waiting to be organized. Add your first task above!';
    elements.emptyStateActionContainer.innerHTML = `
      <button type="button" class="btn btn-primary fw-semibold px-4 d-inline-flex align-items-center gap-2" id="emptyStateAddBtn">
        <i class="bi bi-plus-lg" aria-hidden="true"></i>
        <span>+ Add Your First Task</span>
      </button>
    `;
    const addBtn = document.getElementById('emptyStateAddBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        elements.taskTitleInput.focus();
      });
    }
  } else if (context === 'no-match') {
    elements.emptyStateIcon.className = 'bi bi-search text-secondary display-5';
    elements.emptyStateTitle.textContent = 'No matching tasks found';
    elements.emptyStateDesc.textContent = 'No tasks matched your current search or filter criteria.';
    elements.emptyStateActionContainer.innerHTML = `
      <button type="button" class="btn btn-outline-primary fw-semibold px-4" id="emptyStateResetFilterBtn">
        Reset Search & Filters
      </button>
    `;
    const resetBtn = document.getElementById('emptyStateResetFilterBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.searchQuery = '';
        elements.searchInput.value = '';
        if (elements.clearSearchBtn) elements.clearSearchBtn.classList.add('d-none');
        state.currentFilter = 'all';
        state.currentPriority = 'all';
        if (elements.priorityFilterSelect) elements.priorityFilterSelect.value = 'all';
        updateFilterButtonStyles();
        renderTasks();
      });
    }
  } else if (context === 'no-completed') {
    elements.emptyStateIcon.className = 'bi bi-hourglass-split text-warning display-5';
    elements.emptyStateTitle.textContent = 'No completed tasks yet';
    elements.emptyStateDesc.textContent = 'Complete tasks from your checklist to see them celebrated here.';
    elements.emptyStateActionContainer.innerHTML = `
      <button type="button" class="btn btn-outline-primary fw-semibold px-4" id="emptyStateViewPendingBtn">
        View Pending Tasks
      </button>
    `;
    const viewPendingBtn = document.getElementById('emptyStateViewPendingBtn');
    if (viewPendingBtn) {
      viewPendingBtn.addEventListener('click', () => {
        state.currentFilter = 'pending';
        updateFilterButtonStyles();
        renderTasks();
      });
    }
  }
}

function updateFilterLabel(filteredCount) {
  if (!elements.filterStatusIndicator) return;

  const total = state.tasks.length;
  let text = 'Showing all tasks';

  if (state.currentFilter === 'pending') {
    text = 'Showing pending tasks';
  } else if (state.currentFilter === 'completed') {
    text = 'Showing completed tasks';
  }

  if (state.currentPriority !== 'all') {
    text += ` with ${state.currentPriority} priority`;
  }

  if (state.searchQuery.trim()) {
    text += ` matching "${escapeHtml(state.searchQuery.trim())}"`;
  }

  elements.filterStatusIndicator.textContent = `${text} (${filteredCount} of ${total})`;
}

function renderTasks() {
  if (!elements.taskListContainer) return;

  const filteredTasks = filterTasks();
  const sortedTasks = sortTasks(filteredTasks);

  if (elements.taskListCountBadge) {
    elements.taskListCountBadge.textContent = String(sortedTasks.length);
  }

  updateFilterLabel(sortedTasks.length);

  if (state.tasks.length === 0) {
    elements.taskListContainer.innerHTML = '';
    showEmptyState('no-tasks');
    return;
  }

  if (sortedTasks.length === 0) {
    elements.taskListContainer.innerHTML = '';
    if (state.currentFilter === 'completed') {
      showEmptyState('no-completed');
    } else {
      showEmptyState('no-match');
    }
    return;
  }

  if (elements.emptyStateContainer) {
    elements.emptyStateContainer.classList.add('d-none');
  }

  elements.taskListContainer.innerHTML = sortedTasks.map(renderTask).join('');
}

function updateProductivityMessage(percentage) {
  if (!elements.productivityMotivationMessage) return;

  let message = "Let's get started.";

  if (percentage === 0) {
    message = "Let's get started.";
  } else if (percentage >= 1 && percentage <= 49) {
    message = "You're making progress.";
  } else if (percentage >= 50 && percentage <= 79) {
    message = "You're more than halfway there.";
  } else if (percentage >= 80 && percentage <= 99) {
    message = "Almost there!";
  } else if (percentage === 100) {
    message = "All tasks completed. Great work!";
  }

  elements.productivityMotivationMessage.textContent = message;
}

function updateProgress(completed, total) {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  if (elements.statProgressPct) {
    elements.statProgressPct.textContent = `${percentage}%`;
  }
  if (elements.progressPercentageText) {
    elements.progressPercentageText.textContent = `${percentage}%`;
  }
  if (elements.progressBarFill) {
    elements.progressBarFill.style.width = `${percentage}%`;
    elements.progressBarFill.setAttribute('aria-valuenow', String(percentage));
    
    if (percentage === 100) {
      elements.progressBarFill.className = 'progress-bar progress-bar-striped progress-bar-animated bg-success';
    } else {
      elements.progressBarFill.className = 'progress-bar progress-bar-striped progress-bar-animated bg-primary';
    }
  }

  if (elements.progressRatioDisplay) {
    elements.progressRatioDisplay.textContent = `${completed} of ${total} tasks completed`;
  }

  updateProductivityMessage(percentage);
}

function updateStatistics() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.completed).length;
  const pending = total - completed;

  if (elements.statTotalTasks) {
    elements.statTotalTasks.textContent = String(total);
  }
  if (elements.statPendingTasks) {
    elements.statPendingTasks.textContent = String(pending);
  }
  if (elements.statCompletedTasks) {
    elements.statCompletedTasks.textContent = String(completed);
  }

  if (elements.clearCompletedBtn) {
    elements.clearCompletedBtn.disabled = completed === 0;
  }

  updateProgress(completed, total);
}

function updateFilterButtonStyles() {
  if (!elements.statusFilterGroup) return;
  const buttons = elements.statusFilterGroup.querySelectorAll('button[data-filter]');
  buttons.forEach(btn => {
    if (btn.getAttribute('data-filter') === state.currentFilter) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function setupEventListeners() {
  if (elements.themeToggleBtn) {
    elements.themeToggleBtn.addEventListener('click', () => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      saveTheme(newTheme);
      showToast(`Switched to ${newTheme} mode.`, 'info');
    });
  }

  if (elements.addTaskForm) {
    elements.addTaskForm.addEventListener('submit', addTask);
  }

  if (elements.searchInput) {
    elements.searchInput.addEventListener('input', searchTasks);
  }

  if (elements.clearSearchBtn) {
    elements.clearSearchBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      state.searchQuery = '';
      elements.clearSearchBtn.classList.add('d-none');
      renderTasks();
      elements.searchInput.focus();
    });
  }

  if (elements.statusFilterGroup) {
    elements.statusFilterGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      const filterValue = btn.getAttribute('data-filter');
      if (filterValue && filterValue !== state.currentFilter) {
        state.currentFilter = filterValue;
        updateFilterButtonStyles();
        renderTasks();
      }
    });
  }

  if (elements.priorityFilterSelect) {
    elements.priorityFilterSelect.addEventListener('change', (e) => {
      state.currentPriority = e.target.value;
      renderTasks();
    });
  }

  if (elements.clearCompletedBtn) {
    elements.clearCompletedBtn.addEventListener('click', requestClearCompleted);
  }

  if (elements.confirmClearCompletedBtn) {
    elements.confirmClearCompletedBtn.addEventListener('click', () => {
      if (state.bootstrapModalClear) {
        state.bootstrapModalClear.hide();
      }
      clearCompleted();
    });
  }

  if (elements.confirmDeleteTaskBtn) {
    elements.confirmDeleteTaskBtn.addEventListener('click', () => {
      if (state.bootstrapModalDelete) {
        state.bootstrapModalDelete.hide();
      }
      if (state.taskToDeleteId) {
        deleteTask(state.taskToDeleteId);
      }
    });
  }

  if (elements.taskListContainer) {
    elements.taskListContainer.addEventListener('click', (e) => {
      const checkbox = e.target.closest('.task-checkbox');
      if (checkbox) {
        const taskId = checkbox.getAttribute('data-id');
        toggleTask(taskId);
        return;
      }

      const editBtn = e.target.closest('.edit-btn');
      if (editBtn) {
        const taskId = editBtn.getAttribute('data-id');
        openInlineEdit(taskId);
        return;
      }

      const deleteBtn = e.target.closest('.delete-btn');
      if (deleteBtn) {
        const taskId = deleteBtn.getAttribute('data-id');
        requestDeleteTask(taskId);
        return;
      }

      const saveBtn = e.target.closest('.save-inline-edit-btn');
      if (saveBtn) {
        const taskId = saveBtn.getAttribute('data-id');
        const inlineInput = document.getElementById(`inline-edit-input-${taskId}`);
        if (inlineInput) {
          updateTask(taskId, inlineInput.value);
        }
        return;
      }

      const cancelBtn = e.target.closest('.cancel-inline-edit-btn');
      if (cancelBtn) {
        cancelInlineEdit();
        return;
      }
    });

    elements.taskListContainer.addEventListener('keydown', (e) => {
      const input = e.target.closest('.inline-edit-input');
      if (!input) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        const taskId = state.editingTaskId;
        if (taskId) {
          updateTask(taskId, input.value);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelInlineEdit();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.editingTaskId) {
      cancelInlineEdit();
    }
  });
}

function initApp() {
  initBootstrapComponents();

  const currentTheme = loadTheme();
  saveTheme(currentTheme);

  updateDate();
  updateGreeting();

  state.tasks = loadTasks();

  setupEventListeners();

  renderTasks();
  updateStatistics();

  console.log('Daily Task Planner successfully initialized.');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
