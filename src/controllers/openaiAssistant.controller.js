const assistantsService = require('../services/openaiAssistant.service');

async function send(req, res, next) {
	try {
		const { content, threadId, assistantId, messageOptions, runOptions, createThreadMetadata } = req.body || {};
		const result = await assistantsService.sendMessageAndGetReply({ content, threadId, assistantId, messageOptions, runOptions, createThreadMetadata });
		return res.json({ success: true, data: result });
	} catch (err) { return next(err); }
}

async function createThread(req, res, next) {
	try {
		const { metadata } = req.body || {};
		const result = await assistantsService.createThread(metadata);
		return res.status(201).json({ success: true, data: result });
	} catch (err) { return next(err); }
}

async function addMessage(req, res, next) {
	try {
		const { threadId } = req.params;
		const { content, role = 'user', options = {} } = req.body || {};
		const result = await assistantsService.addMessageToThread(threadId, content, role, options);
		return res.status(201).json({ success: true, data: result });
	} catch (err) { return next(err); }
}

async function listMessages(req, res, next) {
	try {
		const { threadId } = req.params;
		const { limit, order, before, after } = req.query || {};
		const result = await assistantsService.listMessages(threadId, { limit: limit ? Number(limit) : undefined, order, before, after });
		return res.json({ success: true, data: result });
	} catch (err) { return next(err); }
}

async function createRun(req, res, next) {
	try {
		const { threadId } = req.params;
		const { assistantId, options = {} } = req.body || {};
		const result = await assistantsService.createRun(threadId, assistantId, options);
		return res.status(201).json({ success: true, data: result });
	} catch (err) { return next(err); }
}

async function retrieveRun(req, res, next) {
	try {
		const { threadId, runId } = req.params;
		const result = await assistantsService.retrieveRun(threadId, runId);
		return res.json({ success: true, data: result });
	} catch (err) { return next(err); }
}

async function listRuns(req, res, next) {
	try {
		const { threadId } = req.params;
		const { limit, order, before, after } = req.query || {};
		const result = await assistantsService.listRuns(threadId, { limit: limit ? Number(limit) : undefined, order, before, after });
		return res.json({ success: true, data: result });
	} catch (err) { return next(err); }
}

async function cancelRun(req, res, next) {
	try {
		const { threadId, runId } = req.params;
		const result = await assistantsService.cancelRun(threadId, runId);
		return res.json({ success: true, data: result });
	} catch (err) { return next(err); }
}

async function pollRun(req, res, next) {
	try {
		const { threadId, runId } = req.params;
		const { intervalMs, timeoutMs } = req.query || {};
		const result = await assistantsService.pollRunUntilTerminal(threadId, runId, {
			intervalMs: intervalMs ? Number(intervalMs) : undefined,
			timeoutMs: timeoutMs ? Number(timeoutMs) : undefined
		});
		return res.json({ success: true, data: result });
	} catch (err) { return next(err); }
}

module.exports = { send, createThread, addMessage, listMessages, createRun, retrieveRun, listRuns, cancelRun, pollRun }; 