const STORAGE_KEY = 'focusflow.tasks.v1';
const FILTERS = ['all', 'active', 'completed'];

const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const prioritySelect = document.getElementById('prioritySelect');
const dueDateInput = document.getElementById('dueDateInput');
const taskList = document.getElementById('taskList');
const filterButtons = document.querySelectorAll('.filter-btn');
const totalTasksEl = document.getElementById('totalTasks');
const doneTasksEl = document.getElementById('doneTasks');
const openTasksEl = document.getElementById('openTasks');
const todayLabel = document.getElementById('todayLabel');

const state = {
  filter: 'all',
  tasks: loadTasks(),
};

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) && parsed.length ? parsed : getStarterTasks();
  } catch (error) {
    return getStarterTasks();
  }
}

function getStarterTasks() {
  const today = new Date();
  const offset = (days) => {
    const value = new Date(today);
    value.setDate(value.getDate() + days);
    return value.toISOString().slice(0, 10);
  };

  return [
    {
      id: crypto.randomUUID(),
      text: '주간 목표 3가지 정리하기',
      priority: 'high',
      dueDate: offset(0),
      completed: false,
      createdAt: Date.now(),
    },
    {
      id: crypto.randomUUID(),
      text: '디자인 리뷰 메모 정리',
      priority: 'medium',
      dueDate: offset(1),
      completed: true,
      createdAt: Date.now(),
    },
    {
      id: crypto.randomUUID(),
      text: '저녁 식사 계획 세우기',
      priority: 'low',
      dueDate: '',
      completed: false,
      createdAt: Date.now(),
    },
  ];
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function formatDate(dateString) {
  if (!dateString) {
    return '마감일 없음';
  }

  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return '마감일 없음';
  }

  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}

function updateTodayLabel() {
  const now = new Date();
  todayLabel.textContent = now.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

function getVisibleTasks() {
  switch (state.filter) {
    case 'active':
      return state.tasks.filter((task) => !task.completed);
    case 'completed':
      return state.tasks.filter((task) => task.completed);
    default:
      return [...state.tasks];
  }
}

function updateStats() {
  const total = state.tasks.length;
  const completed = state.tasks.filter((task) => task.completed).length;
  const open = total - completed;

  totalTasksEl.textContent = total;
  doneTasksEl.textContent = completed;
  openTasksEl.textContent = open;
}

function renderTasks() {
  const visibleTasks = getVisibleTasks();

  taskList.innerHTML = '';

  if (!visibleTasks.length) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.innerHTML = `
      <div>
        <strong>할 일이 없습니다</strong>
        <span>새로운 목표를 추가해 주세요.</span>
      </div>
    `;
    taskList.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();

  visibleTasks.forEach((task) => {
    const template = document.getElementById('taskTemplate');
    const node = template.content.firstElementChild.cloneNode(true);

    const check = node.querySelector('.task-check');
    const text = node.querySelector('.task-text');
    const meta = node.querySelector('.task-meta');
    const priorityBadge = node.querySelector('.priority-badge');
    const deleteBtn = node.querySelector('.delete-btn');

    check.checked = task.completed;
    text.textContent = task.text;
    meta.textContent = `마감: ${formatDate(task.dueDate)}`;
    priorityBadge.textContent = task.priority === 'high' ? '높음' : task.priority === 'medium' ? '보통' : '낮음';
    priorityBadge.classList.add(task.priority);

    if (task.completed) {
      node.classList.add('completed');
    }

    check.addEventListener('change', () => {
      task.completed = check.checked;
      saveTasks();
      render();
    });

    deleteBtn.addEventListener('click', () => {
      state.tasks = state.tasks.filter((item) => item.id !== task.id);
      saveTasks();
      render();
    });

    fragment.appendChild(node);
  });

  taskList.appendChild(fragment);
}

function render() {
  updateStats();
  renderTasks();
  updateFilterButtons();
}

function updateFilterButtons() {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === state.filter;
    button.classList.toggle('active', isActive);
  });
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    state.filter = button.dataset.filter;
    render();
  });
});

todoForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const text = todoInput.value.trim();
  if (!text) {
    todoInput.focus();
    return;
  }

  const task = {
    id: crypto.randomUUID(),
    text,
    priority: prioritySelect.value,
    dueDate: dueDateInput.value,
    completed: false,
    createdAt: Date.now(),
  };

  state.tasks.unshift(task);
  saveTasks();
  todoForm.reset();
  prioritySelect.value = 'medium';
  render();
  todoInput.focus();
});

updateTodayLabel();
render();
