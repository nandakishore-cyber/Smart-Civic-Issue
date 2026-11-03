const express = require('express');
const router = express.Router();
const {
  listSupervisors,
  createSupervisor,
  updateSupervisor,
  deleteSupervisor,
} = require('../controllers/supervisorController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, listSupervisors);
router.post('/', protect, adminOnly, createSupervisor);
router.put('/:id', protect, adminOnly, updateSupervisor);
router.delete('/:id', protect, adminOnly, deleteSupervisor);

module.exports = router;
