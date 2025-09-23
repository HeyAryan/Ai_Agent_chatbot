const assistantsService = require('../services/openaiAssistant.service');

async function send(data) {
	try {
		const { content, threadId, assistantId, messageOptions, runOptions, createThreadMetadata } = req.body || {};
		const result = await assistantsService.sendMessageAndGetReply({ content, threadId, assistantId, messageOptions, runOptions, createThreadMetadata });
		return res.json({ success: true, data: result });
	} catch (err) { return next(err); }
}

async function createThread(data) {
	try {
		const { metadata } = data || {};
		const result = await assistantsService.createThread(metadata);
		// console.log("Thread created:", result);
		return result;
	} catch (err) { 
		throw err;
	 }
}

async function addMessage(data) {
	console.log(data);
	try {
		const threadId  = data.threadId;
		console.log("Thread ID 22:",threadId);
		const content = data.content;
		const  role = data.role;
		const options = {}
		const result = await assistantsService.addMessageToThread(threadId, content, role, options);
		return result;
	} catch (err) { throw err; }
}

async function listMessages(data) {
	try {
		const threadId = data.threadId;
		const limit  = 10;
		const order = {};
		const before = {};
		const after  = {};
		const result = await assistantsService.listMessages(threadId, { limit: limit ? Number(limit) : undefined, order, before, after });
		return result;
	} catch (err) {throw err; }
}

async function createRun(data) {
	try {
		const threadId= data.threadId;
		const assistantId = data.assistantId || {};
		const options = {}
		const result = await assistantsService.createRun(threadId, assistantId, options);
		return result ;
	} catch (err) { throw err; }
}

async function retrieveRun(data) {
	try {
		const threadId = data.threadId;
		const runId = data.runId;
		const result = await assistantsService.retrieveRun(threadId, runId);
		return result;
	} catch (err) { throw err; }
}

async function listRuns(data) {
	try {
		const { threadId } = req.params;
		const { limit, order, before, after } = req.query || {};
		const result = await assistantsService.listRuns(threadId, { limit: limit ? Number(limit) : undefined, order, before, after });
		return res.json({ success: true, data: result });
	} catch (err) { return next(err); }
}

async function cancelRun(data) {
	try {
		const { threadId, runId } = req.params;
		const result = await assistantsService.cancelRun(threadId, runId);
		return res.json({ success: true, data: result });
	} catch (err) { return next(err); }
}

async function pollRun(data) {
	console.log("pollRun received data:", data);
	try {
		const threadId = data.threadId;
		const runId = data.runId;
		console.log("Extracted threadId:", threadId);
		console.log("Extracted runId:", runId);
		
		if (!threadId) {
			throw new Error('threadId is required for pollRun');
		}
		if (!runId) {
			throw new Error('runId is required for pollRun');
		}
		
		const intervalMs = 1000;
		const timeoutMs = 10000;
		const result = await assistantsService.pollRunUntilTerminal(threadId, runId, {
			intervalMs: intervalMs ? Number(intervalMs) : undefined,
			timeoutMs: timeoutMs ? Number(timeoutMs) : undefined
		});
		return result;
	} catch (err) { 
		console.error("pollRun error:", err);
		throw err; 
	}
}

module.exports = { send, createThread, addMessage, listMessages, createRun, retrieveRun, listRuns, cancelRun, pollRun }; 