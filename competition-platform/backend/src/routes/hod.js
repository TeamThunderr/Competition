router.get("/sections", requireAuth, async (req, res) => {
  const { department, role } = req.user;
  if (role !== "hod") return res.sendStatus(403);

  const { data } = await supabase
    .from("registrations")
    .select("users(section)")
    .eq("users.department", department);

  const counts = {};
  data.forEach(r => {
    counts[r.users.section] = (counts[r.users.section] || 0) + 1;
  });

  res.json(counts);
});
