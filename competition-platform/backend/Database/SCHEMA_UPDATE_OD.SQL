-- File Name: SCHEMA_UPDATE_OD.SQL
-- Purpose: Add fields for HOD to specify duration and time slot for OD approvals

ALTER TABLE od_requests 
ADD COLUMN approved_days INT DEFAULT 1,
ADD COLUMN time_slot TEXT; -- e.g. 'Full Day', 'After Break', 'After Lunch'
