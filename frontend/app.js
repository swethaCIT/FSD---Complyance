const form = document.getElementById('sim-form');
const resultsEl = document.getElementById('results');
const scenariosEl = document.getElementById('scenarios');
const saveBtn = document.getElementById('save-btn');
const reportBtn = document.getElementById('report-btn');
const emailInput = document.getElementById('email');

function formToJson(formEl) {
  const data = Object.fromEntries(new FormData(formEl).entries());
  // Coerce numerics
  for (const k of [
    'monthly_invoice_volume','num_ap_staff','avg_hours_per_invoice','hourly_wage',
    'error_rate_manual','error_cost','time_horizon_months','one_time_implementation_cost']
  ) {
    if (data[k] !== undefined && data[k] !== '') data[k] = Number(data[k]);
  }
  return data;
}

function renderResults(data) {
  const r = data.results;
  resultsEl.innerHTML = `
    <div class="metrics">
      <div><span class="label">Monthly Savings</span><span class="value">$${r.monthly_savings.toLocaleString()}</span></div>
      <div><span class="label">Payback (months)</span><span class="value">${r.payback_months.toLocaleString()}</span></div>
      <div><span class="label">ROI (%)</span><span class="value">${r.roi_percentage.toLocaleString()}%</span></div>
      <hr />
      <div><span class="label">Manual Labor Cost</span><span class="value">$${r.labor_cost_manual.toLocaleString()}</span></div>
      <div><span class="label">Automation Cost</span><span class="value">$${r.auto_cost.toLocaleString()}</span></div>
      <div><span class="label">Error Savings</span><span class="value">$${r.error_savings.toLocaleString()}</span></div>
    </div>
  `;
}

async function simulate() {
  const body = formToJson(form);
  const res = await fetch('/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json();
  if (res.ok) renderResults(data);
}

async function refreshScenarios() {
  const res = await fetch('/scenarios');
  const list = await res.json();
  scenariosEl.innerHTML = '';
  list.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.id} — ${item.scenario_name} — ${item.created_at}`;
    const openBtn = document.createElement('button');
    openBtn.textContent = 'Open';
    openBtn.onclick = async () => {
      const r = await fetch(`/scenarios/${item.id}`);
      const data = await r.json();
      if (!r.ok) return;
      for (const [k,v] of Object.entries(data.inputs)) {
        const input = form.querySelector(`[name="${k}"]`);
        if (input) input.value = v;
      }
      renderResults(data);
    };
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.onclick = async () => {
      await fetch(`/scenarios/${item.id}`, { method: 'DELETE' });
      refreshScenarios();
    };
    li.append(' ', openBtn, ' ', delBtn);
    scenariosEl.appendChild(li);
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  simulate();
});

saveBtn.addEventListener('click', async () => {
  const body = formToJson(form);
  const res = await fetch('/scenarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (res.ok) refreshScenarios();
});

reportBtn.addEventListener('click', async () => {
  const body = formToJson(form);
  body.email = emailInput.value;
  const res = await fetch('/report/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) {
    alert(data.error || 'Failed to generate report');
    return;
  }
  const blob = new Blob([data.html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${body.scenario_name || 'roi-report'}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// Initial
simulate();
refreshScenarios();


