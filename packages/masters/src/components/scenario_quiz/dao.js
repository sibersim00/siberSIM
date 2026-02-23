const scenarioQuestions =
  ({ db }) =>
    async ({ scenariouuid }) => {
      try {
        // First, get scenarioid and scenariotitle
        const [scenarioInfo] = await db.sequelize.query(
          `SELECT scenarioid, scenariotitle 
           FROM scenarios 
           WHERE scenariouuid = ? 
           LIMIT 1`,
          {
            replacements: [scenariouuid],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        if (!scenarioInfo) {
          console.warn("Warning: No scenario found for scenariouuid:", scenariouuid);
          return {
            scenarioid: null,
            scenariotitle: null,
            questionlist: [],
          };
        }

        // Then, fetch all related questions and answers
        const result = await db.sequelize.query(
          `SELECT 
            sq.scenarioquestionid, 
            sq.question_text, 
            sq.question_type, 
            sq.scenarioid,
            sq.status,
            sq.createdon,
            sq.modifiedon,
            s.scenariotitle,
            GROUP_CONCAT(
              CONCAT(
                '{',
                  '"answer_text": "', REPLACE(IFNULL(sqa.answer_text, ''), '"', '\\"'), '", ',
                  '"is_correct": "', IFNULL(sqa.is_correct, 'No'), '", ',
                  '"scenarioquestionanswerid": "', sqa.scenarioquestionanswerid, '"',
                '}'
              )
              ORDER BY sqa.scenarioquestionanswerid SEPARATOR ','
            ) AS answers
          FROM scenario_questions sq
          LEFT JOIN scenario_question_answers sqa 
            ON sqa.scenarioquestionid = sq.scenarioquestionid
          LEFT JOIN scenarios s 
            ON s.scenarioid = sq.scenarioid
          WHERE s.scenariouuid = ?
          GROUP BY 
            sq.scenarioquestionid, 
            sq.question_text, 
            sq.question_type, 
            sq.scenarioid, 
            sq.status, 
            sq.createdon,
            sq.modifiedon,
            s.scenariotitle;`,
          {
            replacements: [scenariouuid],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        const questionlist = result.map((element) => {
          let answersArray = [];

          if (element?.answers) {
            try {
              answersArray = JSON.parse(`[${element.answers}]`);
            } catch {
              answersArray = [];
            }
          }

          answersArray = answersArray.map((ans, index) => ({
            answer_text: ans.answer_text,
            is_correct: ans.is_correct,
            answer_id: index + 1,
          }));

          return {
            scenarioquestionid: element.scenarioquestionid,
            question_text: element.question_text,
            question_type: element.question_type,
            scenarioid: element.scenarioid,
            status: element.status,
            createdon: element.createdon,
            modifiedon: element.modifiedon,
            answers: answersArray,
          };
        });

        return {
          scenarioid: scenarioInfo.scenarioid,
          scenariotitle: scenarioInfo.scenariotitle,
          questionlist,
        };
      } catch (error) {
        console.error("Error fetching scenario questions:", error);
        throw error;
      }
    };


const scenarioQuestionSave =
  ({ db, validation }) =>
    async ({ body, session_userid, session_usertype }) => {
      try {
        //  1. Validate duplicate answers
        const seenAnswers = new Set();
        for (const item of body.answersArray) {
          const trimmedText = item.answer_text.trim().toLowerCase();
          if (seenAnswers.has(trimmedText)) {
            return {
              statusCode: 400,
              message: "Duplicate answer found for the question.",
            };
          }
          seenAnswers.add(trimmedText);
        }

        //  2. Validate scenario exists
        const [scenarioCheck] = await db.sequelize.query(
          `SELECT scenarioid FROM scenarios WHERE scenarioid = ? AND deletedon IS NULL`,
          {
            replacements: [body.scenarioid],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        if (!scenarioCheck) {
          return {
            statusCode: 400,
            message: "Scenario not found or has been deleted.",
          };
        }

        //  3. Check if question exists for update
        const [existingQuestion] = await db.sequelize.query(
          `SELECT scenarioquestionuuid FROM scenario_questions WHERE scenarioquestionid = ?`,
          {
            replacements: [body.scenarioquestionid],
            type: db.sequelize.QueryTypes.SELECT,
          }
        );

        if (existingQuestion) {
          // Update existing question
          const updateQuery = `
          UPDATE scenario_questions   SET modifiedon = CURRENT_TIMESTAMP,   scenarioid = ?,            question_type = ?,   question_text = ?,   modifiedby = ?   WHERE scenarioquestionid = ?   `;
          const replacements = [
            body.scenarioid,
            body.question_type,
            body.question_text,
            session_userid,
            body.scenarioquestionid,
          ];

          await db.sequelize.query(updateQuery, {
            replacements,
            type: db.sequelize.QueryTypes.UPDATE,
          });

          //  Delete old answers
          await db.sequelize.query(
            `DELETE FROM scenario_question_answers WHERE scenarioquestionid = ?`,
            {
              replacements: [body.scenarioquestionid],
              type: db.sequelize.QueryTypes.DELETE,
            }
          );

          //  Insert new answers
          const insertAnswerQuery = `
            INSERT INTO scenario_question_answers (createdon, scenarioquestionid, answer_text, is_correct)
            VALUES (CURRENT_TIMESTAMP, ?, ?, ?)
          `;

          for (const item of body.answersArray) {
            await db.sequelize.query(insertAnswerQuery, {
              replacements: [body.scenarioquestionid, item.answer_text, item.is_correct],
              type: db.sequelize.QueryTypes.INSERT,
            });
          }

          return { statusCode: 200, message: validation.messages.update_success };
        } else {
          // ➕ Insert new question
          const insertQuestionQuery = `
            INSERT INTO scenario_questions (scenarioquestionuuid, createdon, scenarioid, question_type, question_text, added_by, createdby)
            VALUES (UUID(), CURRENT_TIMESTAMP, ?, ?, ?, ?, ?)
          `;
          const insertReplacements = [
            body.scenarioid,
            body.question_type,
            body.question_text,
            session_usertype,
            session_userid,
          ];

          const result = await db.sequelize.query(insertQuestionQuery, {
            replacements: insertReplacements,
            type: db.sequelize.QueryTypes.INSERT,
          });

          const lastInsertedId = result[0];

          //  Insert answers
          const insertAnswerQuery = `
            INSERT INTO scenario_question_answers (createdon, scenarioquestionid, answer_text, is_correct)
            VALUES (CURRENT_TIMESTAMP, ?, ?, ?)
          `;

          for (const item of body.answersArray) {
            await db.sequelize.query(insertAnswerQuery, {
              replacements: [lastInsertedId, item.answer_text, item.is_correct],
              type: db.sequelize.QueryTypes.INSERT,
            });
          }

          return { statusCode: 200, message: validation.messages.save_success };
        }
      } catch (error) {
        console.error("Error in scenarioQuestionSave:", error);
        return {
          statusCode: 500,
          message: "Internal server error.",
        };
      }
    };



const importScenarioQuestion =
  ({ db }) =>
    async ({ body, session_userid, session_usertype }) => {
      try {
        for (const q of body) {
          const scenarioid = q.scenarioid;
          const rawQuestionId = q.scenarioquestionid || null;
          const questionId =
            rawQuestionId && rawQuestionId !== "0" && rawQuestionId !== 0
              ? rawQuestionId
              : null;
          const questionText = q.question_text?.trim() || "";
          const questionType = q.question_type?.trim() || "";

          let insertedQuestionId = questionId;
          if (questionId && scenarioid) {
            // Update existing question
            await db.sequelize.query(
              `UPDATE scenario_questions
             SET question_type = ?, question_text = ?, modifiedon = NOW(), modifiedby = ?
             WHERE scenarioquestionid = ? AND scenarioid = ?`,
              {
                replacements: [
                  questionType,
                  questionText,
                  session_userid,
                  questionId,
                  scenarioid,
                ],
                type: db.sequelize.QueryTypes.UPDATE,
              }
            );


            // Delete existing answers
            await db.sequelize.query(
              `DELETE FROM scenario_question_answers
             WHERE scenarioquestionid = ?`,
              {
                replacements: [questionId],
                type: db.sequelize.QueryTypes.DELETE,
              }
            );
          } else {
            // Insert new question
            const [result] = await db.sequelize.query(
              `INSERT INTO scenario_questions
             (scenarioquestionuuid, scenarioid, question_type, question_text, added_by, status, createdby, createdon)
             VALUES (UUID(), ?, ?, ?, ?, 'Active', ?, NOW())`,
              {
                replacements: [
                  scenarioid,
                  questionType,
                  questionText,
                  session_usertype,
                  session_userid,
                ],
                type: db.sequelize.QueryTypes.INSERT,
              }
            );

            // result is insertId in MySQL
            insertedQuestionId = result;
          }

          // Insert answers
          for (let i = 1; i <= 6; i++) {
            const text = q[`answer_text_${i}`]?.trim();
            const correct = q[`is_correct_${i}`]?.trim();

            if (text && correct !== undefined && correct !== null && correct !== "") {
              await db.sequelize.query(
                `INSERT INTO scenario_question_answers
               (scenarioquestionid, answer_text, is_correct, status, createdon)
               VALUES (?, ?, ?, 'Active', NOW())`,
                {
                  replacements: [insertedQuestionId, text, correct],
                  type: db.sequelize.QueryTypes.INSERT,
                }
              );
            }
          }
        }

        return { statusCode: 200, message: "Import successful" };
      } catch (err) {
        console.error("Import error:", err);
        return { statusCode: 500, message: "Import failed: " + err.message };
      }
    };

const verifyImportScenarioQuestion =
  ({ db }) =>
    async ({ body }) => {
      try {
        const errors = [];
        const success = [];
        const seenQuestionsInFile = new Set();

        // Emoji detection function
        const containsEmoji = (text) => {
          return /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(text);
        };

        // Get existing questions to check for duplicates
        const [existingQuestions] = await db.sequelize.query(`
          SELECT scenarioid, LOWER(TRIM(question_text)) AS question_text
          FROM scenario_questions
          WHERE deletedon IS NULL
        `);

        const existingQuestionsSet = new Set(
          existingQuestions.map((q) => `${q.scenarioid}_${q.question_text}`)
        );

        for (const item of body) {
          const scenarioid = item.scenarioid;
          const questionTextRaw = item.question_text || "";
          const questionText = questionTextRaw.toLowerCase().trim();
          const questionType = item.question_type?.toUpperCase()?.trim();
          const itemErrors = [];

          const uniqueKey = `${scenarioid}_${questionText}`;

          // Check for emoji in question text
          if (containsEmoji(questionTextRaw)) {
            itemErrors.push({
              message: "Emojis are not allowed in question text.",
            });
          }

          // Check for duplicate question in file
          if (seenQuestionsInFile.has(uniqueKey)) {
            itemErrors.push({
              message: "Duplicate question found in import file for the same scenario.",
            });
          } else {
            seenQuestionsInFile.add(uniqueKey);
          }

          // Check for duplicate in DB
          if (existingQuestionsSet.has(uniqueKey)) {
            itemErrors.push({
              message: "This question already exists in the database for the same scenario.",
            });
          }

          // Answer validations
          let hasAnswer = false;
          let correctCount = 0;
          let answerCount = 0;
          const answerSet = new Set();

          for (let i = 1; i <= 6; i++) {
            const ans = item[`answer_text_${i}`]?.trim();
            const isCorrect = item[`is_correct_${i}`]?.trim()?.toLowerCase();

            if (ans) {
              answerCount++;
              hasAnswer = true;

              // Check for emoji in answers
              if (containsEmoji(ans)) {
                itemErrors.push({
                  message: `Emoji is not allowed in answer_text_${i}.`,
                });
              }

              const lowerAns = ans.toLowerCase();
              if (answerSet.has(lowerAns)) {
                itemErrors.push({
                  message: `Duplicate answer option "${ans}" found.`,
                });
              } else {
                answerSet.add(lowerAns);
              }

              if (["yes", "true", "1"].includes(isCorrect)) {
                correctCount++;
              }
            }
          }

          // Check for extra answer options beyond 6
          for (let i = 7; i <= 10; i++) {
            const extraAns = item[`answer_text_${i}`]?.trim();
            if (extraAns) {
              itemErrors.push({
                message: `Too many options: Found answer_text_${i}. Only 6 options allowed.`,
              });

              if (containsEmoji(extraAns)) {
                itemErrors.push({
                  message: `Emoji is not allowed in extra answer_text_${i}.`,
                });
              }

              break;
            }
          }

          if (!hasAnswer) {
            itemErrors.push({ message: "At least one answer must be provided." });
          }

          if (questionType === "SCQ" && correctCount !== 1) {
            itemErrors.push({
              message: "SCQ must have exactly one correct answer.",
            });
          }

          if (questionType === "MCQ" && correctCount < 1) {
            itemErrors.push({
              message: "MCQ must have at least one correct answer.",
            });
          }

          if (itemErrors.length > 0) {
            errors.push({ ...item, issues: itemErrors });
          } else {
            success.push({ ...item, issues: [] });
          }
        }

        return {
          status: true,
          errors,
          success,
        };
      } catch (error) {
        return {
          status: false,
          message: "An error occurred while verifying imported scenario questions.",
          error: error.message || error.toString(),
        };
      }
    };


const statusChange =
  ({ db }) =>
    async ({ body, session_userid }) => {
      try {
        if (!body.status || !session_userid || !body.scenarioquestionid) {
          throw new Error("Missing required fields in statusChange");
        }

        const status =
          body.status === true || body.status === "true" ? "Active" : "Inactive";

        const updateQuery = `
        UPDATE scenario_questions 
        SET status = ?, modifiedon = CURRENT_TIMESTAMP, modifiedby = ? 
        WHERE scenarioquestionid = ?
      `;

        const queryParams = [status, session_userid, body.scenarioquestionid];

        const [res] = await db.sequelize.query(updateQuery, {
          replacements: queryParams,
          type: db.sequelize.QueryTypes.UPDATE,
        });

        return res;
      } catch (error) {
        console.error("Error in statusChange DAO:", error);
        throw error;
      }
    };

const deleteById =
  ({ db }) =>
    async ({ scenarioquestionid }) => {
      try {
        // Soft delete from scenario_questions
        const updateQuestionQuery = `
        UPDATE scenario_questions 
        SET status = 'Inactive', deletedon = NOW() 
        WHERE scenarioquestionid = ?`;

        // Soft delete from scenario_question_answers
        const updateAnswersQuery = `
        UPDATE scenario_question_answers 
        SET status = 'Inactive', deletedon = NOW() 
        WHERE scenarioquestionid = ?`;

        const queryParams = [scenarioquestionid];

        // Execute both queries
        await db.sequelize.query(updateQuestionQuery, {
          replacements: queryParams,
          type: db.sequelize.QueryTypes.UPDATE,
        });

        await db.sequelize.query(updateAnswersQuery, {
          replacements: queryParams,
          type: db.sequelize.QueryTypes.UPDATE,
        });

        return { message: "Deleted question and its answers" };
      } catch (error) {
        console.error("Error deleteById:", error);
        throw error;
      }
    };

module.exports = {
  scenarioQuestions,
  scenarioQuestionSave,
  statusChange,
  deleteById,
  importScenarioQuestion,
  verifyImportScenarioQuestion,
};
