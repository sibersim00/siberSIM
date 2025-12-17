const getFaqsAll = ({ db }) => async (id = null) => {
  try {
    const [res] = await db.sequelize.query(`
      SELECT 
        faq.faq_id,
        faq.question,
        faq.answer,
        faq.order_by,
        faq.type,
        CASE 
          WHEN faq.status = 'Active' THEN 'true' 
          ELSE 'false' 
        END AS status,
        CONCAT(au.firstname, ' ', au.lastname) AS createdby,
        CONCAT(mu.firstname, ' ', mu.lastname) AS modifiedby,
        DATE_FORMAT(faq.createdon, '%Y-%m-%d %H:%i:%s') AS createdon,
        DATE_FORMAT(faq.modifiedon, '%Y-%m-%d %H:%i:%s') AS modifiedon
      FROM mst_faqs faq
      LEFT JOIN ad_users au ON faq.createdby = au.userid
      LEFT JOIN ad_users mu ON faq.modifiedby = mu.userid
      WHERE faq.deletedon IS NULL
      ORDER BY faq.question ASC, 
      CASE WHEN faq.modifiedon IS NOT NULL THEN faq.modifiedon ELSE faq.createdon END DESC
    `);

    return res;
  } catch (error) {
    console.error("FAQ fetch error ==>", error);
    throw error;
  }
};


const statusChange = ({ db, validation }) => async (body) => {
  const status = body.status === 'true' ? 'Active' : 'Inactive';
  const query = `
    UPDATE mst_faqs 
    SET status = :status, 
        modifiedby = :modifiedby, 
        modifiedon = NOW() 
    WHERE faq_id = :faq_id
  `;
  await db.sequelize.query(query, {
    replacements: {
      status,
      modifiedby: body.loginId,
      faq_id: body.faq_id,
    },
  });
  return { statusCode: 200, message: validation.messages.status_change };
};

const getFaqById = ({ db }) => async (id) => {
  const [res] = await db.sequelize.query(
    `SELECT
      faq_id,
      question,
      answer,
      order_by,
      status,
      type,
      createdby,
      modifiedby,
      createdon,
      modifiedon
    FROM mst_faqs
    WHERE deletedon IS NULL
      AND faq_id = :id`,
    {
      replacements: { id },
      type: db.sequelize.QueryTypes.SELECT,
    }
  );
  return res;
};


const save = ({ db, validation }) => async (body, userid) => {
  const errors = [];

  // Check for duplicate
  const checkDuplicate = await db.sequelize.query(
    `SELECT faq_id 
     FROM mst_faqs 
     WHERE deletedon IS NULL 
     AND LOWER(REPLACE(question, ' ', '')) = LOWER(REPLACE(:question, ' ', ''))`,
    {
      replacements: { question: body.question },
      type: db.sequelize.QueryTypes.SELECT,
    }
  );

  if (checkDuplicate.length > 0) {
    errors.push(validation?.messages?.question_duplicate);
  }

  const existingOrder = await db.sequelize.query(
  `SELECT faq_id FROM mst_faqs 
   WHERE deletedon IS NULL AND order_by = :order_by AND type = :type`,
  {
    replacements: { order_by: body.order_by, type: body.type },
    type: db.sequelize.QueryTypes.SELECT,
  }
);

if (existingOrder.length > 0) {
errors.push(validation.messages.order_by_duplicate);
}


  if (errors.length > 0) {
    return { status: false, errors };
  }

  // Safety check
  if (!userid) {
    throw new Error("SIMUser ID is required for saving FAQ.");
  }

  try {
    const insertQuery = `
      INSERT INTO mst_faqs 
        (question, answer, order_by, status, type, createdby, createdon) 
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    const values = [
      body.question,
      body.answer,
      body.order_by ?? null,
      body.status ?? 'Active',
      body.type ?? 'Learner',
      userid,
    ];

    await db.sequelize.query(insertQuery, {
      replacements: values,
      type: db.sequelize.QueryTypes.INSERT,
    });

    return {
      statusCode: 200,
      message: "FAQ has been added successfully",
    };
  } catch (error) {
    console.error("Error saving FAQ:", error);
    throw error;
  }
};




const update = ({ db, validation }) => async (body, userid) => {
  let errors = [];

  // Check required fields and ID presence
  if (!body.faq_id) {
    errors.push("FAQ ID is required for update.");
    return { success: false, errors };
  }
  if (!body.question || !body.answer) {
    errors.push("Question and Answer are required.");
    return { success: false, errors };
  }

  // Check duplicate question (exclude current faq_id)
  const checkDuplicate = await db.sequelize.query(
    `SELECT faq_id FROM mst_faqs 
     WHERE faq_id != :faq_id 
     AND deletedon IS NULL 
     AND LOWER(REPLACE(question, ' ', '')) = LOWER(REPLACE(:question, ' ', ''))`,
    {
      replacements: { faq_id: body.faq_id, question: body.question },
      type: db.sequelize.QueryTypes.SELECT,
    }
  );

  if (checkDuplicate.length > 0) {
    errors.push(validation.messages.question_duplicate || "Duplicate question found.");
  }

  const existingOrder = await db.sequelize.query(
  `SELECT faq_id FROM mst_faqs 
   WHERE deletedon IS NULL AND order_by = :order_by AND type = :type AND faq_id != :faq_id`,
  {
    replacements: {
      order_by: body.order_by,
      type: body.type,
      faq_id: body.faq_id,
    },
    type: db.sequelize.QueryTypes.SELECT,
  }
);

if (existingOrder.length > 0) {
errors.push(validation.messages.order_by_duplicate);
}


  if (errors.length > 0) {
    return { success: false, errors };
  }

  try {
    const updateQuery = `
      UPDATE mst_faqs
      SET question = ?, 
          answer = ?, 
          order_by = ?, 
          type = ?, 
          modifiedby = ?, 
          modifiedon = CURRENT_TIMESTAMP
      WHERE faq_id = ? AND deletedon IS NULL
    `;

    const updateParams = [
      body.question,
      body.answer,
      body.order_by || null,
      body.type ,
      userid,
      body.faq_id,
    ];

    await db.sequelize.query(updateQuery, {
      replacements: updateParams,
      type: db.sequelize.QueryTypes.UPDATE,
    });

    return { success: true, message: validation.messages.update_success };
  } catch (error) {
    console.error("Error updating FAQ:", error);
    throw error;
  }
};

const deleteById = ({ db, validation }) => async (id = null) => {
  if (!id) {
    return { status: false, message: "FAQ ID is required for deletion." };
  }

  try {
    // Check if the FAQ exists and not already deleted
    const [existing] = await db.sequelize.query(
      `SELECT faq_id FROM mst_faqs WHERE faq_id = :id AND deletedon IS NULL`,
      { replacements: { id }, type: db.sequelize.QueryTypes.SELECT }
    );

    if (!existing) {
      return { status: false, message: "FAQ not found or already deleted." };
    }

    // Soft delete by setting deletedon timestamp
    await db.sequelize.query(
      `UPDATE mst_faqs SET deletedon = NOW() WHERE faq_id = :id`,
      { replacements: { id }, type: db.sequelize.QueryTypes.UPDATE }
    );

    return { status: true, message: "FAQ has been deleted successfully." };
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    throw error;
  }
};


const faqVerify = ({ db, validation }) => async (body) => {
  const errors = [];
  const success = [];
  const questionSet = new Set();
  const orderSet = new Set(); // Optional: to check in-request duplicate orders

  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}]/u;

  try {
    for (const element of body) {
      const asset = {
        ...element,
        question: element.question?.trim(),
        answer: element.answer?.trim(),
      };

      const faqErrors = [];

      // Validate question
      if (!asset.question) {
        faqErrors.push({ field: "question", message: "Question cannot be empty." });
      } else if (typeof asset.question !== "string") {
        faqErrors.push({ field: "question", message: "Question must be a string." });
      } else if (emojiRegex.test(asset.question)) {
        faqErrors.push({ field: "question", message: "Emojis are not allowed in question." });
      } else {
        if (asset.question.length < 3 || asset.question.length > 255) {
          faqErrors.push({ field: "question", message: "Question must be between 3 and 255 characters." });
        }

        const normalizedQuestion = asset.question.toLowerCase().replace(/\s+/g, "");
        if (questionSet.has(normalizedQuestion)) {
          faqErrors.push({
            field: "question",
            message: `Duplicate question '${asset.question}' found in request.`,
          });
        } else {
          questionSet.add(normalizedQuestion);
        }

        // Check duplicate question in DB
        let query = `SELECT faq_id FROM mst_faqs 
                     WHERE LOWER(REPLACE(question, ' ', '')) = LOWER(REPLACE(?, ' ', '')) 
                     AND deletedon IS NULL`;
        const replacements = [asset.question];

        if (asset.faq_id) {
          query += ` AND faq_id != ?`;
          replacements.push(asset.faq_id);
        }

        const duplicateCheck = await db.sequelize.query(query, {
          replacements,
          type: db.sequelize.QueryTypes.SELECT,
        });

        if (duplicateCheck.length > 0) {
          faqErrors.push({
            field: "question",
            message: `Question '${asset.question}' already exists.`,
          });
        }
      }

      // Validate answer
      if (!asset.answer) {
        faqErrors.push({ field: "answer", message: "Answer cannot be empty." });
      } else if (typeof asset.answer !== "string") {
        faqErrors.push({ field: "answer", message: "Answer must be a string." });
      } else if (emojiRegex.test(asset.answer)) {
        faqErrors.push({ field: "answer", message: "Emojis are not allowed in answer." });
      } else {
        if (asset.answer.length < 3) {
          faqErrors.push({ field: "answer", message: "Answer must be at least 3 characters." });
        }
      }

      // Validate order_by (optional + DB check)
      if (asset.order_by !== undefined && asset.type) {
        const orderCheckQuery = `
          SELECT faq_id FROM mst_faqs 
          WHERE deletedon IS NULL 
            AND order_by = :order_by 
            AND type = :type
            ${asset.faq_id ? "AND faq_id != :faq_id" : ""}
        `;

        const replacements = {
          order_by: asset.order_by,
          type: asset.type,
          ...(asset.faq_id && { faq_id: asset.faq_id }),
        };

        const existingOrder = await db.sequelize.query(orderCheckQuery, {
          replacements,
          type: db.sequelize.QueryTypes.SELECT,
        });

        if (existingOrder.length > 0) {
          faqErrors.push({
            field: "order_by",
            message: `Order number '${asset.order_by}' already exists for type '${asset.type}'.`,
          });
        }

        // Optional: prevent duplicate order_by in same upload
        const compositeKey = `${asset.type}-${asset.order_by}`;
        if (orderSet.has(compositeKey)) {
          faqErrors.push({
            field: "order_by",
            message: `Duplicate order '${asset.order_by}' found for type '${asset.type}' in request.`,
          });
        } else {
          orderSet.add(compositeKey);
        }
      }

      // Validate faq_id if present
      if (asset.faq_id) {
        const idStr = asset.faq_id.toString();
        if (emojiRegex.test(idStr)) {
          faqErrors.push({ field: "faq_id", message: "Emojis are not allowed in FAQ ID." });
        } else if (!/^\d+$/.test(idStr)) {
          faqErrors.push({ field: "faq_id", message: "FAQ ID must be numeric." });
        } else {
          const checkFaqQuery = `SELECT faq_id FROM mst_faqs WHERE faq_id = :faq_id AND deletedon IS NULL`;
          const checkFaqResult = await db.sequelize.query(checkFaqQuery, {
            replacements: { faq_id: asset.faq_id },
            type: db.sequelize.QueryTypes.SELECT,
          });

          if (checkFaqResult.length === 0) {
            faqErrors.push({
              field: "faq_id",
              message: `FAQ with ID '${asset.faq_id}' not found.`,
            });
          }
        }
      }

      // Push into result arrays
      if (faqErrors.length > 0) {
        asset.issues = faqErrors;
        errors.push(asset);
      } else {
        asset.issues = [];
        success.push(asset);
      }
    }

    return {
      status: true,
      errors,
      success,
    };
  } catch (error) {
    console.error("faqVerify error:", error);
    return {
      status: false,
      message: validation.messages.server_error,
    };
  }
};



const faqImport = ({ db, validation }) => async (body,user) => {
  try {
    if (!Array.isArray(body) || body.length === 0) {
      return { status: false, message: "No data provided for import." };
    }

    const insertedFaqs = [];

    for (const asset of body) {
      if (!asset.question || !asset.answer) {
        continue; // skip incomplete
      }

      if (asset.faq_id && asset.faq_id !== "" && asset.faq_id !== 0) {
        // Update existing FAQ
        const updateQuery = `
          UPDATE mst_faqs 
          SET question = ?, answer = ?, order_by = ?,  type = ?, modifiedby = ?, modifiedon = CURRENT_TIMESTAMP 
          WHERE faq_id = ?`;

        const replacements = [
          asset.question,
          asset.answer,
          asset.order_by,
          asset.type,
          user.userid,
          asset.faq_id
        ];

        const [updatedFaq] = await db.sequelize.query(updateQuery, {
          replacements
        });

        if (updatedFaq) insertedFaqs.push(updatedFaq);
      } else {
        // Insert new FAQ
        const insertQuery = `
          INSERT INTO mst_faqs (question, answer, order_by, type, createdby, createdon)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;

        const replacements = [
          asset.question,
          asset.answer,
          asset.order_by,
          asset.type,
          user.userid
        ];

        const [newFaq] = await db.sequelize.query(insertQuery, {
          replacements
        });

        if (newFaq) insertedFaqs.push(newFaq);
      }
    }

    return {
      status: true,
      message: "FAQs have been imported successfully.",
      insertedFaqs
    };
  } catch (error) {
    console.error("faqImport Error:", error);
    return {
      status: false,
      message: validation.messages.server_error
    };
  }
};


module.exports = {
  getFaqsAll,
  getFaqById,
  save,
  update,
  deleteById,
  statusChange,
  faqVerify,
  faqImport
}