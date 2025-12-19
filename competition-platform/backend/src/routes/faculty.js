router.get("/competitions", requireAuth, async (req, res) => {
  const { department, section, role } = req.user;
  if (role !== "faculty") return res.sendStatus(403);

  const { data } = await supabase
    .from("registrations")
    .select(`
      competition_id,
      competitions(name),
      users!inner(department, section)
    `)
    .eq("users.department", department)
    .eq("users.section", section);

  const result = {};
  data.forEach(r => {
    const name = r.competitions.name;
    result[name] = (result[name] || 0) + 1;
  });

  res.json(result);
});
