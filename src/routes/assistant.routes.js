const express = require('express');
const { send, createThread, addMessage, listMessages, createRun, retrieveRun, listRuns, cancelRun, pollRun } = require('../controllers/openaiAssistant.controller');

const router = express.Router();

// Orchestrated send-and-reply
router.post('/openai/send', send);

// Threads
router.post('/openai/threads', createThread);

// Messages
router.post('/openai/threads/:threadId/messages', addMessage);
router.get('/openai/threads/:threadId/messages', listMessages);

// Runs
router.post('/openai/threads/:threadId/runs', createRun);
router.get('/openai/threads/:threadId/runs', listRuns);
router.get('/openai/threads/:threadId/runs/:runId', retrieveRun);
router.post('/openai/threads/:threadId/runs/:runId/cancel', cancelRun);
router.get('/openai/threads/:threadId/runs/:runId/poll', pollRun);

module.exports = router; 