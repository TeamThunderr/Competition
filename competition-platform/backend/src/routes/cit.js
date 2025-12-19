router.get("/departments", requireAuth, async (req, res) => {
  if (req.user.role !== "cit") return res.sendStatus(403);

  const { data } = await supabase
    .from("registrations")
    .select("users(department)");

  const result = {};
  data.forEach(r => {
    result[r.users.department] = (result[r.users.department] || 0) + 1;
  });

  res.json(result);
});
