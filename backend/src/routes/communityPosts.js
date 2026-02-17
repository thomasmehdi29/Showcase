import { Router } from "express";
import { getDb } from "../db.js";

const router = Router();

function toCommunityPostResponse(row) {
  return {
    id: row.id,
    authorName: row.authorName,
    title: row.title,
    message: row.message,
    category: row.category,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

router.get("/", async (req, res, next) => {
  try {
    const db = await getDb();
    const { category, search } = req.query;

    const where = [];
    const params = [];

    if (category) {
      where.push("LOWER(category) = LOWER(?)");
      params.push(category);
    }

    if (search) {
      where.push("(LOWER(title) LIKE LOWER(?) OR LOWER(message) LIKE LOWER(?) OR LOWER(authorName) LIKE LOWER(?))");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const rows = await db.all(
      `
        SELECT id, authorName, title, message, category, createdAt, updatedAt
        FROM community_posts
        ${whereClause}
        ORDER BY createdAt DESC
      `,
      params,
    );

    return res.json(rows.map(toCommunityPostResponse));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const db = await getDb();
    const { authorName, title, message, category } = req.body;

    if (!authorName || !title || !message) {
      return res.status(400).json({ error: "authorName, title, and message are required." });
    }

    const result = await db.run(
      `
        INSERT INTO community_posts (authorName, title, message, category)
        VALUES (?, ?, ?, ?)
      `,
      [authorName, title, message, category ?? null],
    );

    const row = await db.get(
      `
        SELECT id, authorName, title, message, category, createdAt, updatedAt
        FROM community_posts
        WHERE id = ?
      `,
      result.lastID,
    );

    return res.status(201).json(toCommunityPostResponse(row));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const db = await getDb();
    const postId = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID." });
    }

    const result = await db.run("DELETE FROM community_posts WHERE id = ?", postId);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Community post not found." });
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
