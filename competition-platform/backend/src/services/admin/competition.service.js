const supabase = require("../../config/supabaseClient");

// ✅ Dashboard stats
const fetchDashboardStats = async () => {
  const { count: competitions } = await supabase
    .from("competitions")
    .select("*", { count: "exact", head: true });

  const { count: participation } = await supabase
    .from("registrations")
    .select("*", { count: "exact", head: true });

  return {
    activeCompetitions: competitions,
    totalParticipation: participation,
    lastSync: new Date().toLocaleString()
  };
};

// ✅ Manual insert
const insertManualCompetition = async (data) => {
  await supabase.from("competitions").insert([
    {
      title: data.title || data.name,
      description: data.description,
      platform: data.platform,
      external_link: data.external_link || data.link,
      registration_deadline: data.registration_deadline || data.deadline,
      event_date: data.event_date,
      mode: data.mode,
      venue: data.venue, // Added venue
      organizer: data.organizer,
      team_allowed: data.team_allowed,
      min_team_size: data.min_team_size,
      max_team_size: data.max_team_size,
      departments: data.departments // Ensure specific departments can be saved if schema supports
    }
  ]);
};

// Helper to convert Excel serial date to JS Date
const excelDateToJSDate = (serial) => {
  if (!serial) return null;

  // Handle text strings (e.g. "2026-01-01", "01-17-2026 - 01-18-2026")
  if (typeof serial === 'string') {
    if (serial.toLowerCase().includes('tba')) return null;

    // Handle range: "01-17-2026 - 01-18-2026" -> iterate to find first valid date
    if (serial.includes(' - ')) {
      const parts = serial.split(' - ');
      for (const part of parts) {
        const date = new Date(part);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
      return null; // Fallback if no part is valid
    }

    // Attempt standard parse
    const date = new Date(serial);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    return serial;
  }

  // Handle Excel Serial Numbers
  if (!isNaN(serial)) {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString().split('T')[0];
  }

  return null;
}

// ✅ Bulk insert (CSV / Excel)
const insertBulkCompetitions = async (rows) => {
  const formatted = rows.map(row => ({
    title: row["Competition Name"] || row.Name || row.title,
    description: row.Description || row.description,
    organizer: row.Organizer || row.organizer,
    platform: row.Platform || row.platform,
    venue: row.Venue || row.venue,
    external_link: row["Registration Link"] || row.Link || row.external_link,
    registration_deadline: excelDateToJSDate(row["Registration Deadline"] || row.Deadline || row.registration_deadline),
    event_date: excelDateToJSDate(row["Event Date"] || row.event_date),
    mode: row.Mode || row.mode,
    team_allowed: row["Team Allowed"] || row.team_allowed || true,
    min_team_size: row["Min Team Size"] || row.min_team_size || 1,
    max_team_size: row["Max Team Size"] || row.max_team_size || 4
  }));

  const { data, error } = await supabase.from("competitions").insert(formatted).select();

  if (error) {
    console.error("❌ SUPABASE INSERT ERROR:", JSON.stringify(error, null, 2));
    throw new Error(error.message);
  } else {
    console.log("✅ Successfully inserted rows:", data.length);
  }
};

// ✅ Update competition
const updateCompetition = async (id, data) => {
  const { data: updated, error } = await supabase
    .from("competitions")
    .update({
      title: data.title,
      description: data.description,
      platform: data.platform,
      external_link: data.external_link || data.link,
      registration_deadline: data.registration_deadline || data.deadline,
      event_date: data.event_date,
      mode: data.mode,
      team_allowed: data.team_allowed,
      min_team_size: data.min_team_size,
      max_team_size: data.max_team_size,
      organizer: data.organizer,
      organizer: data.organizer,
      venue: data.venue,
      departments: data.departments
    })
    .eq('id', id)
    .select();

  if (error) throw new Error(error.message);
  return updated;
};

// ✅ Delete competition
const deleteCompetition = async (id) => {
  const { error } = await supabase
    .from("competitions")
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return true;
};

module.exports = {
  fetchDashboardStats,
  insertManualCompetition,
  insertBulkCompetitions,
  updateCompetition,
  deleteCompetition
};
