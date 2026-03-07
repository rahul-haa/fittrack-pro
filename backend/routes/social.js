/**
 * Social Routes — Follow, posts, likes, comments, community feed
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/schema');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

/**
 * POST /api/social/follow/:userId — Follow a user
 */
router.post('/follow/:userId', (req, res) => {
    const db = getDb();
    const targetId = req.params.userId;

    if (targetId === req.user.id) return res.status(400).json({ error: 'Cannot follow yourself.' });

    const existing = db.prepare('SELECT id FROM followers WHERE follower_id = ? AND following_id = ?').get(req.user.id, targetId);
    if (existing) return res.status(409).json({ error: 'Already following.' });

    db.prepare('INSERT INTO followers (id, follower_id, following_id) VALUES (?, ?, ?)').run(uuidv4(), req.user.id, targetId);
    res.status(201).json({ message: 'Followed successfully.' });
});

/**
 * DELETE /api/social/unfollow/:userId — Unfollow a user
 */
router.delete('/unfollow/:userId', (req, res) => {
    const db = getDb();
    db.prepare('DELETE FROM followers WHERE follower_id = ? AND following_id = ?').run(req.user.id, req.params.userId);
    res.json({ message: 'Unfollowed.' });
});

/**
 * POST /api/social/posts — Create a post
 */
router.post('/posts', (req, res) => {
    const { content, post_type, workout_log_id } = req.body;
    const db = getDb();
    const id = uuidv4();

    db.prepare(`
    INSERT INTO social_posts (id, user_id, content, post_type, workout_log_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, req.user.id, content || '', post_type || 'workout', workout_log_id || null);

    const post = db.prepare('SELECT * FROM social_posts WHERE id = ?').get(id);
    res.status(201).json(post);
});

/**
 * GET /api/social/feed — Community feed
 */
router.get('/feed', (req, res) => {
    const db = getDb();

    const posts = db.prepare(`
    SELECT sp.*, u.name as author_name, u.avatar_url as author_avatar,
      (SELECT COUNT(*) FROM social_likes WHERE post_id = sp.id) as likes_count,
      (SELECT COUNT(*) FROM social_comments WHERE post_id = sp.id) as comments_count,
      EXISTS(SELECT 1 FROM social_likes WHERE post_id = sp.id AND user_id = ?) as user_liked
    FROM social_posts sp
    JOIN users u ON sp.user_id = u.id
    ORDER BY sp.created_at DESC
    LIMIT 50
  `).all(req.user.id);

    res.json(posts);
});

/**
 * POST /api/social/posts/:id/like — Like a post
 */
router.post('/posts/:id/like', (req, res) => {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM social_likes WHERE post_id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (existing) {
        db.prepare('DELETE FROM social_likes WHERE post_id = ? AND user_id = ?').run(req.params.id, req.user.id);
        return res.json({ liked: false });
    }

    db.prepare('INSERT INTO social_likes (id, post_id, user_id) VALUES (?, ?, ?)').run(uuidv4(), req.params.id, req.user.id);
    res.json({ liked: true });
});

/**
 * POST /api/social/posts/:id/comment — Comment on a post
 */
router.post('/posts/:id/comment', (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required.' });

    const db = getDb();
    const id = uuidv4();
    db.prepare('INSERT INTO social_comments (id, post_id, user_id, content) VALUES (?, ?, ?, ?)').run(id, req.params.id, req.user.id, content);

    const comment = db.prepare(`
    SELECT sc.*, u.name as author_name FROM social_comments sc
    JOIN users u ON sc.user_id = u.id WHERE sc.id = ?
  `).get(id);

    res.status(201).json(comment);
});

/**
 * GET /api/social/challenges — Active challenges
 */
router.get('/challenges', (req, res) => {
    const db = getDb();
    const challenges = db.prepare(`
    SELECT c.*,
      EXISTS(SELECT 1 FROM challenge_participants WHERE challenge_id = c.id AND user_id = ?) as user_joined,
      (SELECT progress FROM challenge_participants WHERE challenge_id = c.id AND user_id = ?) as user_progress
    FROM challenges c
    ORDER BY c.created_at DESC
  `).all(req.user.id, req.user.id);
    res.json(challenges);
});

/**
 * POST /api/social/challenges/:id/join — Join a challenge
 */
router.post('/challenges/:id/join', (req, res) => {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM challenge_participants WHERE challenge_id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (existing) return res.status(409).json({ error: 'Already joined.' });

    db.prepare('INSERT INTO challenge_participants (id, challenge_id, user_id) VALUES (?, ?, ?)').run(uuidv4(), req.params.id, req.user.id);
    db.prepare('UPDATE challenges SET participants_count = participants_count + 1 WHERE id = ?').run(req.params.id);
    res.status(201).json({ message: 'Joined challenge!' });
});

module.exports = router;
