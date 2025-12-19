router.get("/competitions", requireAuth, async (req, res) => {
  const { id: student_id } = req.user;

  const { data } = await supabase.rpc("student_competitions", {
    sid: student_id
  });

  res.json(data);
});
