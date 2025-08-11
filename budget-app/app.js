const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const state = {
  budget: 0,
  expenses: [],
  theme: null
};

function formatCurrency(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: guessCurrency() }).format(Number(n || 0));
}

function guessCurrency() {
  try {
    const region = Intl.DateTimeFormat().resolvedOptions().locale.split('-')[1] || 'US';
    // naive mapping
    const map = { US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', IN: 'INR', EU: 'EUR' };
    return map[region] || 'USD';
  } catch {
    return 'USD';
  }
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (!theme) {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme = prefersDark ? 'dark' : 'light';
  }
  root.setAttribute('data-theme', theme);
  state.theme = theme;
  store.set('theme', theme);
  // update toggle UI
  const toggle = $('#themeToggle');
  toggle.classList.toggle('on', theme === 'dark');
}

function toggleTheme() {
  applyTheme(state.theme === 'dark' ? 'light' : 'dark');
}

function load() {
  state.budget = Number(store.get('budget', 0)) || 0;
  state.expenses = store.get('expenses', []);
  state.theme = store.get('theme', null);
  applyTheme(state.theme);
  render();
}

function save() {
  store.set('budget', state.budget);
  store.set('expenses', state.expenses);
}

function addExpense(exp) {
  const item = {
    id: crypto.randomUUID(),
    title: exp.title.trim(),
    amount: Number(exp.amount),
    category: exp.category || 'General',
    date: exp.date || new Date().toISOString().slice(0, 10)
  };
  state.expenses.unshift(item);
  save();
  render();
}

function deleteExpense(id) {
  state.expenses = state.expenses.filter(e => e.id !== id);
  save();
  render();
}

function totals() {
  const spent = state.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const remaining = Math.max(state.budget - spent, 0);
  const pct = state.budget > 0 ? Math.min(100, Math.round((spent / state.budget) * 100)) : 0;
  const over = spent > state.budget;
  return { spent, remaining, pct, over };
}

function render() {
  // KPI values
  $('#budgetValue').textContent = formatCurrency(state.budget);
  const t = totals();
  $('#spentValue').textContent = formatCurrency(t.spent);
  $('#remainingValue').textContent = formatCurrency(state.budget - t.spent);
  if (t.over) {
    $('#remainingValue').style.color = getComputedStyle(document.documentElement).getPropertyValue('--danger');
  } else {
    $('#remainingValue').style.color = '';
  }

  // progress ring
  const ring = $('#progressRing');
  ring.style.setProperty('--p', String(t.pct));
  ring.style.background = `radial-gradient(closest-side, var(--bg) 71%, transparent 72% 100%), conic-gradient(${t.over ? 'var(--danger)' : 'var(--accent)'} ${t.pct}%, rgba(127,127,127,0.25) 0)`;
  $('#progressPercent').textContent = `${t.pct}%`;

  // expenses
  const q = ($('#search').value || '').toLowerCase();
  const cat = $('#filterCategory').value || '';
  const list = $('#expenseList');
  list.innerHTML = '';
  const filtered = state.expenses.filter(e =>
    (!q || e.title.toLowerCase().includes(q)) && (!cat || e.category === cat)
  );

  $('#emptyState').hidden = filtered.length !== 0;

  for (const e of filtered) {
    const li = document.createElement('li');

    const left = document.createElement('div');
    left.innerHTML = `<div class="title">${escapeHtml(e.title)}</div><div class="meta">${escapeHtml(e.category)} • ${formatDate(e.date)}</div>`;

    const dateEl = document.createElement('div');
    dateEl.className = 'meta';
    dateEl.textContent = formatDate(e.date);

    const amount = document.createElement('div');
    amount.className = 'amount';
    amount.textContent = formatCurrency(e.amount);

    const del = document.createElement('button');
    del.className = 'del';
    del.textContent = 'Delete';
    del.addEventListener('click', () => deleteExpense(e.id));

    li.append(left, amount, dateEl, del);
    list.appendChild(li);
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso + (iso.length <= 10 ? 'T00:00:00' : ''));
    return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
  } catch { return iso; }
}

function setupInteractions() {
  // theme
  $('#themeToggle').addEventListener('click', toggleTheme);

  // budget edit
  const editBtn = $('#editBudgetBtn');
  const budgetForm = $('#budgetForm');
  const budgetValue = $('#budgetValue');
  const budgetInput = $('#budgetInput');
  const cancelBudget = $('#cancelBudget');

  function openBudgetEdit() {
    budgetForm.hidden = false;
    budgetInput.value = state.budget || '';
    budgetInput.focus();
    editBtn.disabled = true;
  }
  function closeBudgetEdit() {
    budgetForm.hidden = true;
    editBtn.disabled = false;
  }

  editBtn.addEventListener('click', openBudgetEdit);
  cancelBudget.addEventListener('click', closeBudgetEdit);
  budgetForm.addEventListener('submit', e => {
    e.preventDefault();
    const v = Number(budgetInput.value);
    if (Number.isFinite(v) && v >= 0) {
      state.budget = v;
      save();
      render();
      closeBudgetEdit();
    } else {
      budgetInput.focus();
    }
  });

  // expense form
  const expForm = $('#expenseForm');
  expForm.addEventListener('submit', e => {
    e.preventDefault();
    const title = $('#expTitle').value.trim();
    const amount = Number($('#expAmount').value);
    const category = $('#expCategory').value;
    const date = $('#expDate').value;
    if (!title || !(amount >= 0)) return;
    addExpense({ title, amount, category, date });
    expForm.reset();
    $('#expTitle').focus();
  });

  // filters
  $('#search').addEventListener('input', render);
  $('#filterCategory').addEventListener('change', render);
}

document.addEventListener('DOMContentLoaded', () => {
  setupInteractions();
  load();
});

