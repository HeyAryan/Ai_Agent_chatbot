const express = require('express');
const { auth, requireAdmin } = require('../middleware/auth');
const { listAssistants, getAssistant, createAssistant, updateAssistant, deleteAssistant } = require('../controllers/assistants.controller');

const router = express.Router();

router.get('/', listAssistants);
router.get('/:id', getAssistant);
router.post('/', createAssistant);
router.put('/:id', auth, requireAdmin, updateAssistant);
router.delete('/:id', auth, requireAdmin, deleteAssistant);

module.exports = router;


