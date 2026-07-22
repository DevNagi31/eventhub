import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get posts for a group
router.get('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const result = await query(
      `SELECT gp.id, gp.content, gp.image_url, gp.created_at, gp.updated_at,
              u.id as user_id, u.username, u.avatar_url
       FROM group_posts gp
       JOIN users u ON gp.user_id = u.id
       WHERE gp.group_id = $1
       ORDER BY gp.created_at DESC
       LIMIT $2 OFFSET $3`,
      [groupId, limit, offset]
    );

    res.json({ posts: result.rows });
  } catch (error) {
    console.error('Error fetching group posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create a post
router.post('/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Post content is required' });
    }

    // Check membership
    const member = await query(
      'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, req.user.id]
    );

    if (member.rows.length === 0) {
      return res.status(403).json({ error: 'Must be a group member to post' });
    }

    const result = await query(
      `INSERT INTO group_posts (group_id, user_id, content, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING *`,
      [groupId, req.user.id, content.trim()]
    );

    // Fetch with username for response
    const post = await query(
      `SELECT gp.*, u.username, u.avatar_url
       FROM group_posts gp
       JOIN users u ON gp.user_id = u.id
       WHERE gp.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json({ post: post.rows[0] });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Delete a post (author or group admin)
router.delete('/:groupId/:postId', authenticateToken, async (req, res) => {
  try {
    const { groupId, postId } = req.params;

    const post = await query(
      'SELECT user_id FROM group_posts WHERE id = $1 AND group_id = $2',
      [postId, groupId]
    );

    if (post.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Allow deletion by post author or group admin
    const isAuthor = post.rows[0].user_id === req.user.id;
    if (!isAuthor) {
      const admin = await query(
        "SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2 AND role IN ('admin', 'moderator')",
        [groupId, req.user.id]
      );
      if (admin.rows.length === 0) {
        return res.status(403).json({ error: 'Only the author or an admin can delete this post' });
      }
    }

    await query('DELETE FROM group_posts WHERE id = $1', [postId]);
    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

export default router;
