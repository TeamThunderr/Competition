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
      name: data.name,
      deadline: data.deadline,
      platform: data.platform,
      description: data.description,
      link: data.link
    }
  ]);
};

// ✅ Bulk insert (CSV / Excel)
const insertBulkCompetitions = async (rows) => {
  const formatted = rows.map(row => ({
    name: row.Name,
    deadline: row.Deadline,
    platform: row.Platform,
    description: row.Description,
    link: row.Link
  }));

  await supabase.from("competitions").insert(formatted);
};

module.exports = {
  fetchDashboardStats,
  insertManualCompetition,
  insertBulkCompetitions
};
