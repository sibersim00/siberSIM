const theme =
  ({ db }) =>
  async (learner_id, themeParam) => {
    try {
      // If themeParam is provided -> sanitize and update
      if (typeof themeParam !== "undefined" && themeParam !== null) {
        const t =
          String(themeParam).toLowerCase() === "dark" ? "dark" : "light";
        await db.sequelize.query(
          `UPDATE learners SET theme_preference = :_theme WHERE learner_id = :_learner_id`,
          {
            replacements: {
              _learner_id: learner_id,
              _theme: t,
            },
          }
        );
        return t;
      }

      // Otherwise fetch current theme
      const rows = await db.sequelize.query(
        `SELECT theme_preference FROM learners WHERE learner_id = :_learner_id`,
        {
          replacements: { _learner_id: learner_id },
          type: db.sequelize.QueryTypes.SELECT,  
          
        
        }
      );

      if (rows && rows.length > 0) {
      return rows[0].theme_preference || "dark";
    }
    return "dark";
    } catch (error) {
      throw error;
    }
  };

module.exports = {
  theme,
};
