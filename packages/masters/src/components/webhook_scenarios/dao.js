const importScenario =
  ({ db }) =>
  async (body, userId) => {
    const [scenario] = await db.sequelize.query(
      `SELECT scenarioid, scenariouuid, scenarioidentification, scenariotitle
       FROM scenarios
       WHERE deletedon IS NULL
         AND LOWER(TRIM(scenarioidentification)) = LOWER(:identification)
       LIMIT 1`,
      {
        replacements: { identification: body.identification },
        type: db.sequelize.QueryTypes.SELECT,
      },
    );

    if (!scenario) {
      return {
        statusCode: 400,
        message: "No scenario exists with the supplied identification.",
      };
    }

    await db.sequelize.query(
      `UPDATE scenarios
       SET scenariodiagram = :scenarioDiagram,
           modifiedby = :modifiedBy,
           modifiedon = NOW()
       WHERE scenarioid = :scenarioId`,
      {
        replacements: {
          scenarioDiagram: JSON.stringify(body.scenario_json),
          modifiedBy: userId,
          scenarioId: scenario.scenarioid,
        },
        type: db.sequelize.QueryTypes.UPDATE,
      },
    );

    return {
      statusCode: 200,
      message: "Scenario diagram imported successfully.",
      data: scenario,
    };
  };

module.exports = { importScenario };
