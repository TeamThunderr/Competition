# 📧 Gmail Sync V2 Implementation Guide

## 🎯 **V2 Core Principles**

### **1. Faculty-Controlled Timing**
- **Admin uploads competition** → `uploaded_at` timestamp stored
- **Faculty clicks "Sync Competition"** → Gmail scan initiated
- **Incremental sync** → Only scan emails since `last_synced_at` (or `uploaded_at` if first sync)

### **2. State Consistency (Never Downgrade)**
```
WON > QUALIFIED > REGISTERED
```
- **QUALIFIED** never deletes **REGISTERED**
- **WON** upgrades **QUALIFIED** and maintains **REGISTERED**
- **REJECTED** does nothing (keeps existing registration)

### **3. Single Source of Truth**
```sql
-- FACT Table (registrations)
registrations(user_id, competition_id, verified, source)
-- Row exists = Student is REGISTERED

-- PROGRESSION Table (competition_status)  
competition_status(user_id, competition_id, is_shortlisted, is_winner)
-- is_shortlisted = true → Student is QUALIFIED
-- is_winner = true → Student WON (implies shortlisted)
```

## 🗄️ **Database Schema Updates**

### **Required Schema Changes**
```sql
-- Add timestamp fields for incremental sync
ALTER TABLE competitions 
ADD COLUMN uploaded_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN last_synced_at TIMESTAMPTZ DEFAULT NULL;

-- Add constraint for data integrity
ALTER TABLE competition_status 
ADD CONSTRAINT check_winner_implies_shortlisted 
CHECK (NOT is_winner OR is_shortlisted);
```

### **Apply Schema Updates**
```bash
# Run the V2 schema update
psql -d your_database -f backend/Database/SCHEMA_UPDATE_V2.SQL
```

## 🔧 **V2 Implementation Files**

### **Core Services**
- **`gmailSyncV2.service.js`** - Main V2 sync logic
- **`studentDashboardV2.service.js`** - Consistent student dashboard
- **`facultyV2.controller.js`** - Faculty V2 endpoints

### **Updated Controllers**
- **`registration.controller.js`** - Updated with V2 write rules
- **`facultyV2.routes.js`** - New V2 API endpoints

### **Database Updates**
- **`SCHEMA_UPDATE_V2.SQL`** - Required schema changes

## 🚀 **API Endpoints (V2)**

### **Faculty Endpoints**
```javascript
// Initiate Gmail sync for competition
POST /api/faculty/v2/sync-competition
{
  "competitionId": "uuid"
}

// Get V2 dashboard stats (corrected counts)
GET /api/faculty/v2/dashboard-stats-v2

// Get competition sync status
GET /api/faculty/v2/competition-sync-status

// Get student competitions with V2 status
GET /api/faculty/v2/student/:studentId/competitions-v2
```

### **Student Endpoints (Updated)**
```javascript
// Gmail verification (uses V2 write rules)
POST /api/student/check-status
{
  "competition_id": "uuid",
  "provider_token": "gmail_token"
}

// Manual proof upload (uses V2 write rules)
POST /api/student/upload-proof
{
  "competition_id": "uuid", 
  "proof_url": "url"
}
```

## 📊 **V2 Dashboard Counting Logic**

### **Faculty Dashboard (Source of Truth)**
```sql
-- Registered Count
SELECT COUNT(*) FROM registrations 
WHERE user_id IN (faculty_students);

-- Qualified Count  
SELECT COUNT(*) FROM competition_status 
WHERE user_id IN (faculty_students) AND is_shortlisted = true;

-- Won Count
SELECT COUNT(*) FROM competition_status 
WHERE user_id IN (faculty_students) AND is_winner = true;
```

### **Student Dashboard (Must Match Faculty)**
```javascript
// Student sees same logic
const competitions = registrations.map(reg => {
  const status = statuses.find(s => s.competition_id === reg.competitions.id);
  
  let currentStatus = 'REGISTERED';
  if (status?.is_winner) currentStatus = 'WON';
  else if (status?.is_shortlisted) currentStatus = 'QUALIFIED';
  
  return { ...reg, status: currentStatus };
});
```

## 🔄 **V2 Gmail Sync Flow**

### **1. Faculty Initiates Sync**
```javascript
// Faculty clicks "Sync Competition" button
POST /api/faculty/v2/sync-competition
{
  "competitionId": "competition-uuid"
}
```

### **2. Determine Sync Window**
```javascript
const scanStartTime = competition.last_synced_at || competition.uploaded_at;
const scanEndTime = new Date().toISOString();
```

### **3. Process Each Student**
```javascript
for (const student of facultyStudents) {
  // Scan Gmail in time window
  const emailMatches = await scanGmailInTimeWindow(
    student.accessToken, 
    competition, 
    scanStartTime, 
    scanEndTime
  );
  
  // Apply V2 write rules
  for (const match of emailMatches) {
    await applyGmailDetectionV2(student.id, competition.id, match.status);
  }
}
```

### **4. Update Sync Timestamp**
```javascript
await supabase
  .from('competitions')
  .update({ last_synced_at: scanEndTime })
  .eq('id', competitionId);
```

## ✅ **V2 Write Rules Implementation**

### **REGISTERED Status**
```javascript
case 'REGISTERED':
  // Ensure registration exists in FACT table
  await ensureRegistrationExists(userId, competitionId, 'AUTO_GMAIL');
  break;
```

### **QUALIFIED Status**
```javascript
case 'QUALIFIED':
  // Ensure registration exists (FACT)
  await ensureRegistrationExists(userId, competitionId, 'AUTO_GMAIL');
  // Update progression status
  await upsertCompetitionStatus(userId, competitionId, { is_shortlisted: true });
  break;
```

### **WON Status**
```javascript
case 'WON':
  // Ensure registration exists (FACT)
  await ensureRegistrationExists(userId, competitionId, 'AUTO_GMAIL');
  // Update progression status (winner implies shortlisted)
  await upsertCompetitionStatus(userId, competitionId, { 
    is_shortlisted: true, 
    is_winner: true 
  });
  break;
```

### **REJECTED Status**
```javascript
case 'REJECTED':
  // Do NOTHING - keep registration fact if it exists
  console.log('REJECTED status detected, no action taken');
  break;
```

## 🧪 **Testing V2 Implementation**

### **Run V2 Tests**
```bash
cd backend
node test_v2_implementation.js
```

### **Test Coverage**
- ✅ V2 write rules (REGISTERED → QUALIFIED → WON)
- ✅ No downgrade protection
- ✅ Dashboard count consistency
- ✅ Incremental sync logic
- ✅ State progression rules

## 🔒 **V2 Safety Features**

### **1. Idempotent Operations**
- Safe to click "Sync Competition" multiple times
- Duplicate registrations prevented by unique constraints
- Status upgrades only, never downgrades

### **2. Data Integrity**
- Database constraints ensure winner implies shortlisted
- Foreign key constraints prevent orphaned records
- Transaction-based operations for consistency

### **3. Error Handling**
- Graceful handling of missing Gmail tokens
- Detailed error logging for debugging
- Partial sync success (continues if individual student fails)

## 📈 **Migration from V1 to V2**

### **1. Apply Schema Updates**
```sql
-- Run SCHEMA_UPDATE_V2.SQL
-- Adds uploaded_at, last_synced_at fields
-- Adds integrity constraints
```

### **2. Update API Calls**
```javascript
// Old V1 endpoint
POST /api/faculty/sync-all-competitions

// New V2 endpoint  
POST /api/faculty/v2/sync-competition
{ "competitionId": "specific-uuid" }
```

### **3. Update Frontend**
```javascript
// Use V2 dashboard stats endpoint
const stats = await api.get('/api/faculty/v2/dashboard-stats-v2');

// Use V2 sync endpoint
const syncResult = await api.post('/api/faculty/v2/sync-competition', {
  competitionId: selectedCompetition.id
});
```

## 🎯 **Success Criteria Verification**

### **✅ Mentor Dashboard = Student Dashboard Counts**
```javascript
// Both use same counting logic from registrations + competition_status tables
```

### **✅ QUALIFIED Never Disappears**
```javascript
// upsertCompetitionStatus prevents downgrades
// is_shortlisted can only go from false → true
```

### **✅ Gmail Sync Only Scans New Emails**
```javascript
// Time-based queries using last_synced_at timestamp
// Incremental sync prevents re-processing old emails
```

### **✅ Faculty Controls Sync Timing**
```javascript
// Faculty clicks "Sync Competition" button
// No automatic background sync
```

### **✅ System Works for Multiple Competitions**
```javascript
// Competition-specific sync with individual last_synced_at timestamps
// Parallel processing of multiple competitions
```

## 🚀 **Production Deployment**

### **1. Database Migration**
```bash
# Apply V2 schema updates
psql -d production_db -f SCHEMA_UPDATE_V2.SQL
```

### **2. API Deployment**
```bash
# Deploy backend with V2 services
npm run build
pm2 restart backend
```

### **3. Frontend Updates**
```bash
# Update frontend to use V2 endpoints
npm run build
# Deploy to production
```

### **4. Verification**
```bash
# Run V2 tests against production
node test_v2_implementation.js
```

This V2 implementation provides a clean, deterministic, faculty-controlled Gmail sync system that maintains data consistency and provides accurate dashboard counts for institutional use.