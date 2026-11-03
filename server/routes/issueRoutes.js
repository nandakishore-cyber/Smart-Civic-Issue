const express = require('express');
const router = express.Router();
const {
  createIssue,
  getMyIssues,
  getAllIssues,
  getIssueById,
  getIssueImage,
  updateIssue,
  deleteIssue,
  getDashboardStats,
  getOfficerIssues,
  updateOfficerIssue,
} = require('../controllers/issueController');
const { protect, adminOnly, govOfficerOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// POST /api/issues - Create a new issue (authenticated user)
router.post('/', protect, upload.single('image'), createIssue);

// GET /api/issues/my - Get current user's issues
router.get('/my', protect, getMyIssues);

// GET /api/issues/stats - Get dashboard stats (admin only)
router.get('/stats', protect, adminOnly, getDashboardStats);

router.get('/officer/queue', protect, govOfficerOnly, getOfficerIssues);
router.put('/officer/:id', protect, govOfficerOnly, updateOfficerIssue);

// GET /api/issues - Get all issues (admin only)
router.get('/', protect, adminOnly, getAllIssues);

router.get('/:id/image', protect, getIssueImage);

// GET /api/issues/:id - Get issue by ID
router.get('/:id', protect, getIssueById);

// PUT /api/issues/:id - Update issue (admin only)
router.put('/:id', protect, adminOnly, updateIssue);

// DELETE /api/issues/:id - Delete issue (admin only)
router.delete('/:id', protect, adminOnly, deleteIssue);

module.exports = router;
