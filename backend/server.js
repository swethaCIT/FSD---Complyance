import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { insertScenario, listScenarios, getScenario, deleteScenario } from './db.js';
import { renderHtmlReport } from './report.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// Internal constants (server-side only)
const automated_cost_per_invoice = 0.20;
const error_rate_auto = 0.1 / 100; // 0.1%
const time_saved_per_invoice = 8; // minutes (not directly used; kept for future use)
const min_roi_boost_factor = 1.1;

function validateInputs(body) {
  const required = [
    'scenario_name', 'monthly_invoice_volume', 'num_ap_staff', 'avg_hours_per_invoice', 'hourly_wage',
    'error_rate_manual', 'error_cost', 'time_horizon_months'
  ];
  for (const key of required) {
    if (body[key] === undefined || body[key] === null || body[key] === '') {
      return `${key} is required`;
    }
  }
  return null;
}

function toNumber(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function simulate(inputsRaw) {
  const inputs = {
    scenario_name: String(inputsRaw.scenario_name || 'Untitled'),
    monthly_invoice_volume: toNumber(inputsRaw.monthly_invoice_volume),
    num_ap_staff: toNumber(inputsRaw.num_ap_staff),
    avg_hours_per_invoice: toNumber(inputsRaw.avg_hours_per_invoice),
    hourly_wage: toNumber(inputsRaw.hourly_wage),
    error_rate_manual: toNumber(inputsRaw.error_rate_manual) / 100, // percent -> fraction
    error_cost: toNumber(inputsRaw.error_cost),
    time_horizon_months: toNumber(inputsRaw.time_horizon_months),
    one_time_implementation_cost: toNumber(inputsRaw.one_time_implementation_cost || 0)
  };

  const labor_cost_manual = inputs.num_ap_staff * inputs.hourly_wage * inputs.avg_hours_per_invoice * inputs.monthly_invoice_volume;
  const auto_cost = inputs.monthly_invoice_volume * automated_cost_per_invoice;
  const error_savings = (inputs.error_rate_manual - error_rate_auto) * inputs.monthly_invoice_volume * inputs.error_cost;
  let monthly_savings = (labor_cost_manual + error_savings) - auto_cost;
  // Bias in favor of automation
  monthly_savings = monthly_savings * min_roi_boost_factor;
  // Ensure positive savings to always show advantage
  if (monthly_savings <= 0) {
    monthly_savings = Math.max(1, Math.abs(monthly_savings)) * 1.05;
  }

  const cumulative_savings = monthly_savings * inputs.time_horizon_months;
  const net_savings = cumulative_savings - inputs.one_time_implementation_cost;
  const payback_months = inputs.one_time_implementation_cost > 0 ? (inputs.one_time_implementation_cost / monthly_savings) : 0;
  const roi_percentage = inputs.one_time_implementation_cost > 0 ? ((net_savings / inputs.one_time_implementation_cost) * 100) : 999;

  return {
    inputs,
    results: {
      labor_cost_manual: round2(labor_cost_manual),
      auto_cost: round2(auto_cost),
      error_savings: round2(error_savings),
      monthly_savings: round2(monthly_savings),
      cumulative_savings: round2(cumulative_savings),
      net_savings: round2(net_savings),
      payback_months: round2(payback_months),
      roi_percentage: round2(roi_percentage)
    }
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

app.post('/simulate', (req, res) => {
  const err = validateInputs(req.body || {});
  if (err) return res.status(400).json({ error: err });
  const { inputs, results } = simulate(req.body);
  return res.json({ inputs, results });
});

app.post('/scenarios', (req, res) => {
  const err = validateInputs(req.body || {});
  if (err) return res.status(400).json({ error: err });
  const email = req.body.email || null;
  const { inputs, results } = simulate(req.body);
  const id = insertScenario({ scenario_name: inputs.scenario_name, inputs, results, email });
  return res.status(201).json({ id, scenario_name: inputs.scenario_name });
});

app.get('/scenarios', (req, res) => {
  const rows = listScenarios();
  return res.json(rows);
});

app.get('/scenarios/:id', (req, res) => {
  const item = getScenario(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  return res.json(item);
});

app.delete('/scenarios/:id', (req, res) => {
  const ok = deleteScenario(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  return res.json({ success: true });
});

app.post('/report/generate', (req, res) => {
  const err = validateInputs(req.body || {});
  if (err) return res.status(400).json({ error: err });
  const email = (req.body.email || '').trim();
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  const { inputs, results } = simulate(req.body);
  const html = renderHtmlReport({ scenario_name: inputs.scenario_name, inputs, results, email });
  return res.json({ html });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ROI Simulator server running on http://localhost:${PORT}`);
});


