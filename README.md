# FSD---Complyance
Full-stack app to calculate cost savings, ROI & payback when switching from manual to automated invoicing.
Built with React, Node.js (Express), and PostgreSQL.

Features
Real-time ROI simulation
CRUD: save/load/delete scenarios
Email-gated HTML report
Positive ROI bias built-in
Simple REST API + persistent DB

Tech Stack
Layer	Tech
Frontend	React, Tailwind, Axios
Backend	Node.js, Express
Database	PostgreSQL
Report	HTML/PDF

DB Schema
CREATE TABLE scenarios (
  id SERIAL PRIMARY KEY,
  scenario_name VARCHAR(100),
  inputs JSONB,
  results JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

API Endpoints
Method	Endpoint	Description
POST	/api/simulate	Run ROI simulation
POST	/api/scenarios	Save scenario
GET	/api/scenarios	List all scenarios
GET	/api/scenarios/:id	Get scenario details
DELETE	/api/scenarios/:id	Delete scenario
POST	/api/report/generate	Generate HTML/PDF report (email required)

Frontend
Form inputs for business metrics
Real-time simulation via /simulate
Save / Load / Delete scenarios
Enter email → download HTML report

