/**
 * SUNLOC INTEGRATED SERVER
 * Shared backend for Planning App + DPR App
 * Stack: Node.js + Express + SQLite (better-sqlite3)
 */

const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Database Setup ────────────────────────────────────────────
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'sunloc.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read/write performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ────────────────────────────────────────────────────
db.exec(`
  -- Planning app full state (JSON blob per save)
  CREATE TABLE IF NOT EXISTS planning_state (
    id INTEGER PRIMARY KEY,
    state_json TEXT NOT NULL,
    saved_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- DPR daily records per floor per date
  CREATE TABLE IF NOT EXISTS dpr_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    floor TEXT NOT NULL,
    date TEXT NOT NULL,
    data_json TEXT NOT NULL,
    saved_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(floor, date)
  );

  -- Production actuals: one row per machine per order per date
  -- This is the bridge table between DPR and Planning
  CREATE TABLE IF NOT EXISTS production_actuals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT,
    batch_number TEXT,
    machine_id TEXT NOT NULL,
    date TEXT NOT NULL,
    shift TEXT NOT NULL,
    run_index INTEGER NOT NULL DEFAULT 0,  -- supports multiple batch runs per machine per shift
    qty_lakhs REAL DEFAULT 0,
    floor TEXT,
    synced_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(machine_id, date, shift, run_index)
  );

  -- Index for fast order lookups
  CREATE INDEX IF NOT EXISTS idx_actuals_order ON production_actuals(order_id);
  CREATE INDEX IF NOT EXISTS idx_actuals_batch ON production_actuals(batch_number);
  CREATE INDEX IF NOT EXISTS idx_actuals_machine ON production_actuals(machine_id, date);
  CREATE INDEX IF NOT EXISTS idx_dpr_date ON dpr_records(date);
`);

// ─── Helper: get latest planning state ────────────────────────
function getPlanningState() {
  const row = db.prepare('SELECT state_json FROM planning_state ORDER BY id DESC LIMIT 1').get();
  if (!row) return { orders: [], printOrders: [], dispatchPlans: [], dailyPrinting: [], machineMaster: [], printMachineMaster: [], packSizes: {} };
  try { return JSON.parse(row.state_json); } catch { return {}; }
}

// ─── Helper: get active orders for a machine ──────────────────
function getActiveOrdersForMachine(machineId) {
  const state = getPlanningState();
  const orders = state.orders || [];
  return orders.filter(o =>
    o.machineId === machineId &&
    o.status !== 'closed' &&
    !o.deleted
  ).map(o => ({
    id: o.id,
    batchNumber: o.batchNumber || '',
    poNumber: o.poNumber || '',
    customer: o.customer || '',
    size: o.size || '',
    colour: o.colour || '',
    qty: o.qty || 0,
    isPrinted: o.isPrinted || false,
    status: o.status || 'pending',
    zone: o.zone || '',
  }));
}

// Helper: get total actuals for an order (sums all runs across all machines/shifts)
function getOrderActuals(orderId, batchNumber) {
  let rows;
  if (orderId) {
    rows = db.prepare('SELECT SUM(qty_lakhs) as total FROM production_actuals WHERE order_id = ?').get(orderId);
    if (!rows?.total && batchNumber) {
      rows = db.prepare('SELECT SUM(qty_lakhs) as total FROM production_actuals WHERE batch_number = ?').get(batchNumber);
    }
  } else if (batchNumber) {
    rows = db.prepare('SELECT SUM(qty_lakhs) as total FROM production_actuals WHERE batch_number = ?').get(batchNumber);
  }
  return rows?.total || 0;
}

// ═══════════════════════════════════════════════════════════════
// PLANNING APP ROUTES
// ═══════════════════════════════════════════════════════════════

// GET full planning state
app.get('/api/planning/state', (req, res) => {
  try {
    const state = getPlanningState();

    // Enrich orders with live actuals from DPR
    if (state.orders) {
      for (const ord of state.orders) {
        const actual = getOrderActuals(ord.id, ord.batchNumber);
        ord.actualProd = actual;
        if (actual > 0 && ord.status === 'pending') ord.status = 'running';
      }
    }

    res.json({ ok: true, state, savedAt: db.prepare('SELECT saved_at FROM planning_state ORDER BY id DESC LIMIT 1').get()?.saved_at });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST save planning state
app.post('/api/planning/state', (req, res) => {
  try {
    const { state } = req.body;
    if (!state) return res.status(400).json({ ok: false, error: 'No state provided' });

    const json = JSON.stringify(state);
    const existing = db.prepare('SELECT id FROM planning_state LIMIT 1').get();
    if (existing) {
      db.prepare('UPDATE planning_state SET state_json = ?, saved_at = datetime(\'now\') WHERE id = ?').run(json, existing.id);
    } else {
      db.prepare('INSERT INTO planning_state (state_json) VALUES (?)').run(json);
    }

    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET active orders for a machine (used by DPR dropdown)
app.get('/api/orders/machine/:machineId', (req, res) => {
  try {
    const orders = getActiveOrdersForMachine(req.params.machineId);
    res.json({ ok: true, orders });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET all active orders (summary for DPR to cache on load)
app.get('/api/orders/active', (req, res) => {
  try {
    const state = getPlanningState();
    const orders = (state.orders || [])
      .filter(o => o.status !== 'closed' && !o.deleted)
      .map(o => ({
        id: o.id,
        batchNumber: o.batchNumber || '',
        poNumber: o.poNumber || '',
        customer: o.customer || '',
        machineId: o.machineId || '',
        size: o.size || '',
        colour: o.colour || '',
        qty: o.qty || 0,
        status: o.status || 'pending',
      }));
    res.json({ ok: true, orders });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// DPR APP ROUTES
// ═══════════════════════════════════════════════════════════════

// GET DPR record for a floor + date
app.get('/api/dpr/:floor/:date', (req, res) => {
  try {
    const { floor, date } = req.params;
    const row = db.prepare('SELECT data_json, saved_at FROM dpr_records WHERE floor = ? AND date = ?').get(floor, date);
    if (!row) return res.json({ ok: true, data: null });
    res.json({ ok: true, data: JSON.parse(row.data_json), savedAt: row.saved_at });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST save DPR record + extract actuals into bridge table
app.post('/api/dpr/save', (req, res) => {
  try {
    const { floor, date, data, actuals } = req.body;
    if (!floor || !date || !data) return res.status(400).json({ ok: false, error: 'Missing floor, date, or data' });

    // Save full DPR record
    db.prepare(`
      INSERT INTO dpr_records (floor, date, data_json)
      VALUES (?, ?, ?)
      ON CONFLICT(floor, date) DO UPDATE SET data_json = excluded.data_json, saved_at = datetime('now')
    `).run(floor, date, JSON.stringify(data));

    // Upsert actuals — supports multi-run (colour change / batch change within same shift)
    const upsertActual = db.prepare(`
      INSERT INTO production_actuals (order_id, batch_number, machine_id, date, shift, run_index, qty_lakhs, floor)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(machine_id, date, shift, run_index) DO UPDATE SET
        order_id = excluded.order_id,
        batch_number = excluded.batch_number,
        qty_lakhs = excluded.qty_lakhs,
        synced_at = datetime('now')
    `);

    // Delete old runs for this floor+date first (clean re-sync)
    const deleteOld = db.prepare(`
      DELETE FROM production_actuals WHERE floor = ? AND date = ?
    `);

    const syncActuals = db.transaction((actualsArr, floor, date) => {
      deleteOld.run(floor, date);
      if (actualsArr && actualsArr.length > 0) {
        // New format: pre-flattened actuals array from DPR app (supports multi-run)
        for (const a of actualsArr) {
          if (!a.qty || a.qty <= 0) continue;
          upsertActual.run(a.orderId || null, a.batchNumber || null, a.machineId, date, a.shift, a.runIndex || 0, a.qty, a.floor || floor);
        }
      } else {
        // Fallback: parse from data.shifts for old single-run format
        const shifts = data.shifts || {};
        for (const [shiftName, shiftData] of Object.entries(shifts)) {
          if (!shiftData.machines) continue;
          for (const [machineId, machineData] of Object.entries(shiftData.machines)) {
            const runs = machineData.runs || [{ orderId: machineData.orderId, batchNumber: machineData.batchNumber, qty: machineData.prod }];
            runs.forEach((run, ri) => {
              const qty = parseFloat(run.qty) || 0;
              if (qty <= 0) return;
              upsertActual.run(run.orderId || null, run.batchNumber || null, machineId, date, shiftName, ri, qty, floor);
            });
          }
        }
      }
    });

    syncActuals(actuals, floor, date);

    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET all DPR dates (for history navigation)
app.get('/api/dpr/dates/:floor', (req, res) => {
  try {
    const rows = db.prepare('SELECT DISTINCT date FROM dpr_records WHERE floor = ? ORDER BY date DESC').all(req.params.floor);
    res.json({ ok: true, dates: rows.map(r => r.date) });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET actuals summary for a machine (for DPR to show cumulative vs planned)
app.get('/api/actuals/machine/:machineId', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT date, shift, qty_lakhs, order_id, batch_number
      FROM production_actuals
      WHERE machine_id = ?
      ORDER BY date DESC, shift
      LIMIT 90
    `).all(req.params.machineId);
    res.json({ ok: true, actuals: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET actuals for a specific order
app.get('/api/actuals/order/:orderId', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT date, shift, qty_lakhs, machine_id
      FROM production_actuals
      WHERE order_id = ? OR batch_number = ?
      ORDER BY date, shift
    `).all(req.params.orderId, req.params.orderId);
    const total = rows.reduce((s, r) => s + r.qty_lakhs, 0);
    res.json({ ok: true, actuals: rows, total });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// HEALTH CHECK + INFO
// ═══════════════════════════════════════════════════════════════

app.get('/api/health', (req, res) => {
  const planningRow = db.prepare('SELECT saved_at FROM planning_state ORDER BY id DESC LIMIT 1').get();
  const dprCount = db.prepare('SELECT COUNT(*) as c FROM dpr_records').get();
  const actualsCount = db.prepare('SELECT COUNT(*) as c FROM production_actuals').get();
  res.json({
    ok: true,
    server: 'Sunloc Integrated Server v1.0',
    db: DB_PATH,
    planningSavedAt: planningRow?.saved_at || null,
    dprRecords: dprCount.c,
    actualsEntries: actualsCount.c,
    uptime: Math.floor(process.uptime()) + 's',
  });
});

// Catch-all: serve index.html for unknown routes (SPA fallback)
app.get('*', (req, res) => {
  const idx = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(idx)) res.sendFile(idx);
  else res.json({ ok: false, error: 'No frontend found. Place Planning App and DPR App in /public folder.' });
});


// ═══════════════════════════════════════════════════════
// TRACKING APP SCHEMA (add to existing server.js)
// ═══════════════════════════════════════════════════════

db.exec(`
  -- Labels generated for each batch
  CREATE TABLE IF NOT EXISTS tracking_labels (
    id TEXT PRIMARY KEY,
    batch_number TEXT NOT NULL,
    label_number INTEGER NOT NULL,
    size TEXT NOT NULL,
    qty REAL NOT NULL,
    is_partial INTEGER DEFAULT 0,
    is_orange INTEGER DEFAULT 0,
    parent_label_id TEXT,
    customer TEXT,
    colour TEXT,
    pc_code TEXT,
    po_number TEXT,
    machine_id TEXT,
    printing_matter TEXT,
    generated TEXT NOT NULL DEFAULT (datetime('now')),
    printed INTEGER DEFAULT 0,
    printed_at TEXT,
    voided INTEGER DEFAULT 0,
    void_reason TEXT,
    voided_at TEXT,
    voided_by TEXT,
    qr_data TEXT,
    UNIQUE(batch_number, label_number, is_orange)
  );

  -- Every scan event (IN/OUT per department)
  CREATE TABLE IF NOT EXISTS tracking_scans (
    id TEXT PRIMARY KEY,
    label_id TEXT NOT NULL,
    batch_number TEXT NOT NULL,
    dept TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('in','out')),
    ts TEXT NOT NULL DEFAULT (datetime('now')),
    operator TEXT,
    size TEXT,
    qty REAL,
    FOREIGN KEY(label_id) REFERENCES tracking_labels(id)
  );

  -- Per batch per department stage closure
  CREATE TABLE IF NOT EXISTS tracking_stage_closure (
    id TEXT PRIMARY KEY,
    batch_number TEXT NOT NULL,
    dept TEXT NOT NULL,
    closed INTEGER DEFAULT 1,
    closed_at TEXT NOT NULL DEFAULT (datetime('now')),
    closed_by TEXT,
    UNIQUE(batch_number, dept)
  );

  -- Manual wastage entries (salvage + remelt) per stage
  CREATE TABLE IF NOT EXISTS tracking_wastage (
    id TEXT PRIMARY KEY,
    batch_number TEXT NOT NULL,
    dept TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('salvage','remelt')),
    qty REAL NOT NULL,
    ts TEXT NOT NULL DEFAULT (datetime('now')),
    by TEXT
  );

  -- Dispatch records
  CREATE TABLE IF NOT EXISTS tracking_dispatch_records (
    id TEXT PRIMARY KEY,
    batch_number TEXT NOT NULL,
    customer TEXT,
    qty REAL NOT NULL,
    boxes INTEGER NOT NULL,
    vehicle_no TEXT,
    invoice_no TEXT,
    remarks TEXT,
    ts TEXT NOT NULL DEFAULT (datetime('now')),
    by TEXT
  );

  -- 48h alerts
  CREATE TABLE IF NOT EXISTS tracking_alerts (
    id TEXT PRIMARY KEY,
    label_id TEXT NOT NULL,
    batch_number TEXT NOT NULL,
    dept TEXT NOT NULL,
    scan_in_ts TEXT NOT NULL,
    hours_stuck REAL,
    resolved INTEGER DEFAULT 0,
    UNIQUE(label_id, dept)
  );

  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_scans_label ON tracking_scans(label_id);
  CREATE INDEX IF NOT EXISTS idx_scans_batch ON tracking_scans(batch_number);
  CREATE INDEX IF NOT EXISTS idx_scans_dept ON tracking_scans(dept, type);
  CREATE INDEX IF NOT EXISTS idx_labels_batch ON tracking_labels(batch_number);
  CREATE INDEX IF NOT EXISTS idx_closure_batch ON tracking_stage_closure(batch_number);
  CREATE INDEX IF NOT EXISTS idx_wastage_batch ON tracking_wastage(batch_number, dept);
`);

// ─── TRACKING ROUTES ──────────────────────────────────

// GET full tracking state (for app init)
app.get('/api/tracking/state', (req, res) => {
  try {
    const labels = db.prepare('SELECT * FROM tracking_labels ORDER BY batch_number, label_number').all();
    const scans = db.prepare('SELECT * FROM tracking_scans ORDER BY ts DESC LIMIT 5000').all();
    const stageClosure = db.prepare('SELECT * FROM tracking_stage_closure').all();
    const wastage = db.prepare('SELECT * FROM tracking_wastage').all();
    const dispatchRecs = db.prepare('SELECT * FROM tracking_dispatch_records ORDER BY ts DESC').all();
    const alerts = db.prepare('SELECT * FROM tracking_alerts WHERE resolved = 0').all();

    // Convert snake_case to camelCase for frontend
    const mapLabel = l => ({ id:l.id, batchNumber:l.batch_number, labelNumber:l.label_number, size:l.size, qty:l.qty, isPartial:!!l.is_partial, isOrange:!!l.is_orange, parentLabelId:l.parent_label_id, customer:l.customer, colour:l.colour, pcCode:l.pc_code, poNumber:l.po_number, machineId:l.machine_id, printingMatter:l.printing_matter, generated:l.generated, printed:!!l.printed, printedAt:l.printed_at, voided:!!l.voided, voidReason:l.void_reason, voidedAt:l.voided_at, voidedBy:l.voided_by, qrData:l.qr_data });
    const mapScan = s => ({ id:s.id, labelId:s.label_id, batchNumber:s.batch_number, dept:s.dept, type:s.type, ts:s.ts, operator:s.operator, size:s.size, qty:s.qty });
    const mapClosure = c => ({ id:c.id, batchNumber:c.batch_number, dept:c.dept, closed:!!c.closed, closedAt:c.closed_at, closedBy:c.closed_by });
    const mapWastage = w => ({ id:w.id, batchNumber:w.batch_number, dept:w.dept, type:w.type, qty:w.qty, ts:w.ts, by:w.by });
    const mapDispatch = d => ({ id:d.id, batchNumber:d.batch_number, customer:d.customer, qty:d.qty, boxes:d.boxes, vehicleNo:d.vehicle_no, invoiceNo:d.invoice_no, remarks:d.remarks, ts:d.ts, by:d.by });
    const mapAlert = a => ({ id:a.id, labelId:a.label_id, batchNumber:a.batch_number, dept:a.dept, scanInTs:a.scan_in_ts, hoursStuck:a.hours_stuck });

    res.json({ ok:true, state:{ labels:labels.map(mapLabel), scans:scans.map(mapScan), stageClosure:stageClosure.map(mapClosure), wastage:wastage.map(mapWastage), dispatchRecs:dispatchRecs.map(mapDispatch), alerts:alerts.map(mapAlert) } });
  } catch(err) { res.status(500).json({ ok:false, error:err.message }); }
});

// POST save labels
app.post('/api/tracking/labels', (req, res) => {
  try {
    const { labels } = req.body;
    if(!labels?.length) return res.status(400).json({ ok:false, error:'No labels' });
    const insert = db.prepare(`INSERT OR REPLACE INTO tracking_labels (id,batch_number,label_number,size,qty,is_partial,is_orange,parent_label_id,customer,colour,pc_code,po_number,machine_id,printing_matter,generated,qr_data) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    const tx = db.transaction(lbls => { lbls.forEach(l => insert.run(l.id,l.batchNumber,l.labelNumber,l.size,l.qty,l.isPartial?1:0,l.isOrange?1:0,l.parentLabelId||null,l.customer||null,l.colour||null,l.pcCode||null,l.poNumber||null,l.machineId||null,l.printingMatter||null,l.generated,l.qrData)); });
    tx(labels);
    res.json({ ok:true });
  } catch(err) { res.status(500).json({ ok:false, error:err.message }); }
});

// POST void label
app.post('/api/tracking/label-void', (req, res) => {
  try {
    const { labelId, reason, voidedBy } = req.body;
    db.prepare(`UPDATE tracking_labels SET voided=1, void_reason=?, voided_at=datetime('now'), voided_by=? WHERE id=?`).run(reason||'',voidedBy||'',labelId);
    res.json({ ok:true });
  } catch(err) { res.status(500).json({ ok:false, error:err.message }); }
});

// POST record scan
app.post('/api/tracking/scan', (req, res) => {
  try {
    const { scan } = req.body;
    if(!scan) return res.status(400).json({ ok:false, error:'No scan data' });
    db.prepare(`INSERT OR IGNORE INTO tracking_scans (id,label_id,batch_number,dept,type,ts,operator,size,qty) VALUES (?,?,?,?,?,?,?,?,?)`).run(scan.id,scan.labelId,scan.batchNumber,scan.dept,scan.type,scan.ts,scan.operator||null,scan.size||null,scan.qty||null);
    // Check for 48h alert
    if(scan.type==='in'){
      const hasOut = db.prepare(`SELECT id FROM tracking_scans WHERE label_id=? AND dept=? AND type='out' AND ts>?`).get(scan.labelId,scan.dept,scan.ts);
      if(!hasOut){
        // Schedule alert check (simplified: just store the scan-in for later check)
      }
    } else if(scan.type==='out'){
      // Resolve any alert for this label/dept
      db.prepare(`UPDATE tracking_alerts SET resolved=1 WHERE label_id=? AND dept=?`).run(scan.labelId,scan.dept);
    }
    res.json({ ok:true });
  } catch(err) { res.status(500).json({ ok:false, error:err.message }); }
});

// POST save wastage
app.post('/api/tracking/wastage', (req, res) => {
  try {
    const { batchNumber, dept, salvage, remelt } = req.body;
    const id1 = Date.now().toString(36)+'s', id2 = Date.now().toString(36)+'r';
    if(salvage>0) db.prepare(`INSERT INTO tracking_wastage (id,batch_number,dept,type,qty) VALUES (?,?,?,'salvage',?)`).run(id1,batchNumber,dept,salvage);
    if(remelt>0)  db.prepare(`INSERT INTO tracking_wastage (id,batch_number,dept,type,qty) VALUES (?,?,?,'remelt',?)`).run(id2,batchNumber,dept,remelt);
    res.json({ ok:true });
  } catch(err) { res.status(500).json({ ok:false, error:err.message }); }
});

// POST close stage
app.post('/api/tracking/stage-close', (req, res) => {
  try {
    const { batchNumber, dept, closedBy } = req.body;
    db.prepare(`INSERT OR REPLACE INTO tracking_stage_closure (id,batch_number,dept,closed,closed_at,closed_by) VALUES (?,?,?,1,datetime('now'),?)`).run(Date.now().toString(36),batchNumber,dept,closedBy||'');
    res.json({ ok:true });
  } catch(err) { res.status(500).json({ ok:false, error:err.message }); }
});

// POST dispatch record
app.post('/api/tracking/dispatch-record', (req, res) => {
  try {
    const { record } = req.body;
    db.prepare(`INSERT INTO tracking_dispatch_records (id,batch_number,customer,qty,boxes,vehicle_no,invoice_no,remarks,ts,by) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(record.id,record.batchNumber,record.customer||'',record.qty,record.boxes,record.vehicleNo||'',record.invoiceNo||'',record.remarks||'',record.ts,record.by||'');
    res.json({ ok:true });
  } catch(err) { res.status(500).json({ ok:false, error:err.message }); }
});

// POST update dispatch in planning app
app.post('/api/tracking/dispatch-update', (req, res) => {
  try {
    const { batchNumber, dispatchedQty, vehicleNo, invoiceNo } = req.body;
    const state = getPlanningState();
    if(state.dispatchPlans){
      const plan = state.dispatchPlans.find(p => p.batchNumber===batchNumber || p.productionOrderId===batchNumber);
      if(plan){
        plan.actualDispatched = (plan.actualDispatched||0) + dispatchedQty;
        if(plan.actualDispatched >= plan.qty) plan.status='dispatched';
        if(vehicleNo) plan.vehicleNo=vehicleNo;
        if(invoiceNo) plan.invoiceNo=invoiceNo;
        const json = JSON.stringify(state);
        const existing = db.prepare('SELECT id FROM planning_state LIMIT 1').get();
        if(existing) db.prepare(`UPDATE planning_state SET state_json=?, saved_at=datetime('now') WHERE id=?`).run(json,existing.id);
      }
    }
    res.json({ ok:true });
  } catch(err) { res.status(500).json({ ok:false, error:err.message }); }
});

// POST ready to invoice
app.post('/api/tracking/ready-to-invoice', (req, res) => {
  try {
    const { batchNumber } = req.body;
    const state = getPlanningState();
    if(state.orders){
      const order = state.orders.find(o=>o.batchNumber===batchNumber);
      if(order){ order.trackingStatus='ready_to_invoice'; order.readyToInvoiceAt=new Date().toISOString(); }
      const json=JSON.stringify(state);
      const existing=db.prepare('SELECT id FROM planning_state LIMIT 1').get();
      if(existing) db.prepare(`UPDATE planning_state SET state_json=?, saved_at=datetime('now') WHERE id=?`).run(json,existing.id);
    }
    res.json({ ok:true });
  } catch(err) { res.status(500).json({ ok:false, error:err.message }); }
});

// POST stage status update (for planning app order card)
app.post('/api/tracking/stage-status', (req, res) => {
  try {
    const { batchNumber, statusMap } = req.body;
    const state = getPlanningState();
    if(state.orders){
      const order = state.orders.find(o=>o.batchNumber===batchNumber);
      if(order){ order.stageStatus=statusMap; order.lastStageUpdate=new Date().toISOString(); }
      const json=JSON.stringify(state);
      const existing=db.prepare('SELECT id FROM planning_state LIMIT 1').get();
      if(existing) db.prepare(`UPDATE planning_state SET state_json=?, saved_at=datetime('now') WHERE id=?`).run(json,existing.id);
    }
    res.json({ ok:true });
  } catch(err) { res.status(500).json({ ok:false, error:err.message }); }
});

// GET WIP summary for planning app dispatch date recalculation
app.get('/api/tracking/wip-summary', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT s.batch_number, s.dept, s.type, COUNT(*) as cnt
      FROM tracking_scans s
      GROUP BY s.batch_number, s.dept, s.type
    `).all();
    const closures = db.prepare('SELECT batch_number, dept FROM tracking_stage_closure WHERE closed=1').all();
    const alerts = db.prepare('SELECT batch_number, label_id, dept, hours_stuck FROM tracking_alerts WHERE resolved=0').all();
    // Calculate net WIP per batch (boxes in minus boxes out across all non-dispatch stages)
    const wipMap = {};
    rows.forEach(r => {
      if (!wipMap[r.batch_number]) wipMap[r.batch_number] = {};
      if (!wipMap[r.batch_number][r.dept]) wipMap[r.batch_number][r.dept] = { in:0, out:0 };
      wipMap[r.batch_number][r.dept][r.type] = r.cnt;
    });
    // Return wip box counts per batch
    const wipBoxes = {};
    Object.entries(wipMap).forEach(([bn, depts]) => {
      let netBoxes = 0;
      ['aim','printing','pi','packing'].forEach(dept => {
        if (depts[dept]) netBoxes += Math.max(0, (depts[dept].in||0) - (depts[dept].out||0));
      });
      wipBoxes[bn] = netBoxes;
    });
    res.json({ ok:true, scanSummary:rows, closures, alerts, wipBoxes });
  } catch(err) { res.status(500).json({ ok:false, error:err.message }); }
});

// GET 48h alert check (called by cron or on demand)
app.get('/api/tracking/check-alerts', (req, res) => {
  try {
    const threshold = 48 * 60 * 60; // seconds
    const pendingIns = db.prepare(`
      SELECT s.id, s.label_id, s.batch_number, s.dept, s.ts,
        (julianday('now') - julianday(s.ts)) * 24 as hours_stuck
      FROM tracking_scans s
      WHERE s.type='in'
      AND NOT EXISTS (
        SELECT 1 FROM tracking_scans s2
        WHERE s2.label_id=s.label_id AND s2.dept=s.dept AND s2.type='out' AND s2.ts>s.ts
      )
      AND (julianday('now') - julianday(s.ts)) * 86400 >= ?
    `).all(threshold);

    const insertAlert = db.prepare(`INSERT OR REPLACE INTO tracking_alerts (id,label_id,batch_number,dept,scan_in_ts,hours_stuck,resolved) VALUES (?,?,?,?,?,?,0)`);
    const tx = db.transaction(alerts => { alerts.forEach(a => insertAlert.run(a.id+'_alert',a.label_id,a.batch_number,a.dept,a.ts,a.hours_stuck)); });
    tx(pendingIns);

    res.json({ ok:true, alertCount:pendingIns.length, alerts:pendingIns });
  } catch(err) { res.status(500).json({ ok:false, error:err.message }); }
});

// Run alert check every hour
setInterval(() => {
  try {
    const threshold = 48 * 3600;
    const pending = db.prepare(`
      SELECT s.id, s.label_id, s.batch_number, s.dept, s.ts,
        (julianday('now') - julianday(s.ts)) * 24 as hours_stuck
      FROM tracking_scans s
      WHERE s.type='in'
      AND NOT EXISTS (SELECT 1 FROM tracking_scans s2 WHERE s2.label_id=s.label_id AND s2.dept=s.dept AND s2.type='out' AND s2.ts>s.ts)
      AND (julianday('now') - julianday(s.ts)) * 86400 >= ?
    `).all(threshold);
    const ins = db.prepare(`INSERT OR REPLACE INTO tracking_alerts (id,label_id,batch_number,dept,scan_in_ts,hours_stuck,resolved) VALUES (?,?,?,?,?,?,0)`);
    pending.forEach(a => ins.run(a.id+'_alert',a.label_id,a.batch_number,a.dept,a.ts,a.hours_stuck));
    if(pending.length) console.log(`⚠️ ${pending.length} tracking alerts generated`);
  } catch(e){ console.error('Alert check error:',e); }
}, 60*60*1000);



// ─── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Sunloc Server running on port ${PORT}`);
  console.log(`   DB: ${DB_PATH}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
});

module.exports = app;
