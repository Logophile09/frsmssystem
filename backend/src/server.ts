import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import meRoutes from './routes/me';
import registerRoutes from './routes/register';
import personnelRoutes from './routes/personnel';
import vehicleRoutes from './routes/vehicles';
import equipmentRoutes from './routes/equipment';
import incidentRoutes from './routes/incidents';
import attendanceRoutes from './routes/attendance';
import staffAccountRoutes from './routes/staffAccounts';
import establishmentRoutes from './routes/establishments';
import inspectionRoutes from './routes/inspections';
import certificateRoutes from './routes/certificates';
import violationRoutes from './routes/violations';
import gpsRoutes from './routes/gps';
import falseAlarmRoutes from './routes/falseAlarms';
import dashboardRoutes from './routes/dashboard';
import aiRoutes from './routes/ai';
import postIncidentReportRoutes from './routes/postIncidentReports';

const app = express();

const origins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map((o) => o.trim());
app.use(cors({ origin: origins, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'frsms-backend' }));

app.use('/api/me', meRoutes);
app.use('/api/register', registerRoutes);
app.use('/api/personnel', personnelRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/staff-accounts', staffAccountRoutes);
app.use('/api/establishments', establishmentRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/violations', violationRoutes);
app.use('/api/gps', gpsRoutes);
app.use('/api/false-alarms', falseAlarmRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/post-incident-reports', postIncidentReportRoutes);

// Vercel imports this module and calls `app` directly as a serverless
// function per request -- it must NOT also bind a persistent port in
// that environment. Everywhere else (local dev, or a standalone Node
// host) this is a normal long-running Express server.
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT ?? 4000);
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`FRSMS backend listening on http://localhost:${port}`);
  });
}

export default app;
