import fs from 'fs';
import path from 'path';

export function renderHtmlReport({ scenario_name, inputs, results, email }) {
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>ROI Report - ${escapeHtml(scenario_name || 'Untitled')}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #111; }
    h1 { color: #0b5; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
    .muted { color: #6b7280; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 6px 4px; border-bottom: 1px solid #f1f5f9; }
  </style>
  </head>
  <body>
    <h1>Invoicing ROI Report</h1>
    <p class="muted">Lead: ${escapeHtml(email || 'N/A')}</p>
    <h2>${escapeHtml(scenario_name || 'Untitled')}</h2>
    <div class="grid">
      <div class="card">
        <h3>Inputs</h3>
        ${kvTable(inputs)}
      </div>
      <div class="card">
        <h3>Results</h3>
        ${kvTable(results)}
      </div>
    </div>
  </body>
  </html>`;
  return html;
}

function kvTable(obj) {
  const rows = Object.entries(obj).map(([k, v]) => {
    return `<tr><td>${escapeHtml(k)}</td><td style="text-align:right">${escapeHtml(formatValue(v))}</td></tr>`;
  }).join('');
  return `<table>${rows}</table>`;
}

function formatValue(v) {
  if (typeof v === 'number') {
    return Number.isInteger(v) ? v.toString() : v.toFixed(2);
  }
  return String(v);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


