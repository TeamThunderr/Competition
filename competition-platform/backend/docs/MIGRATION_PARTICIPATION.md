# Participation to Registrations Migration

**Date of Migration**: June 23, 2026

## Overview
This document outlines the migration process that merged the legacy `participation` table into the primary `registrations` table. All references to the legacy `participation` table in the backend source code have been updated or removed. The `participation` table was dropped from the database.

## Schema Changes
The `registrations` table was enhanced with the following columns to accommodate the migrated participation data (which largely consisted of Gmail-sourced auto-detections):
- `gmail_message_id TEXT`
- `confidence_score INTEGER`
- `raw_email_subject TEXT`

## Column Mapping
During the migration, records were copied from `participation` to `registrations` using the following column mapping:

| `participation` (Legacy) | `registrations` (New) |
| --- | --- |
| `student_id` | `user_id` |
| `competition_id` | `competition_id` |
| `status` | `status` |
| `gmail_message_id` | `gmail_message_id` |
| `confidence_score` | `confidence_score` |
| `created_at` | `created_at` |
| *(None)* | `source = 'gmail'` |
| *(None)* | `verified = false` |

## Verification
To verify the success of the migration, check that the row counts match the old participation table using this query:
```sql
SELECT COUNT(*) FROM registrations WHERE source = 'gmail';
```

## Removed Assets
- The `participation` table has been completely removed from the Supabase instance.
- `backend/src/controllers/faculty/participation.controller.js` and other legacy backend controllers handling `participation` logic have been refactored to rely exclusively on `registrations`.
- The `SCHEMA.SQL` file no longer contains the `participation` table definition.
