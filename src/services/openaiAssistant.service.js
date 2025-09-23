const OpenAI = require('openai');
const config = require('../config');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function ensureConfigured() {
	if (!process.env.OPENAI_API_KEY) {
		throw new Error('OPENAI_API_KEY is not configured');
	}
}

async function createThread(metadata = undefined) {
	ensureConfigured();
	const thread = await client.beta.threads.create({ metadata });
	return thread;
}

async function addMessageToThread(threadId, content, role = 'user', options = {}) {
	ensureConfigured();
	if (!threadId) throw new Error('threadId is required');
	if (!content) throw new Error('content is required');
	const { attachments = undefined, metadata = undefined } = options;
	const message = await client.beta.threads.messages.create(threadId, {
		role,
		content,
		attachments,
		metadata
	});
	return message;
}

async function listMessages(threadId, params = {}) {
	ensureConfigured();
	if (!threadId) throw new Error('threadId is required');
	const { limit = 20, order = 'desc', before = undefined, after = undefined } = params;
	const messages = await client.beta.threads.messages.list(threadId, { limit, order, before, after });
	return messages;
}

async function createRun(threadId, assistantId = undefined, options = {}) {
	console.log("Creating run with assistantId:", assistantId);
	ensureConfigured();
	if (!threadId) throw new Error('threadId is required');
	const resolvedAssistantId = assistantId;
	if (!resolvedAssistantId) throw new Error('assistantId is required (pass explicitly or set OPENAI_ASSISTANT_ID)');
	const { instructions = undefined, additional_instructions = undefined, tools = undefined, metadata = undefined, model = undefined, response_format = undefined, temperature = undefined, top_p = undefined, max_prompt_tokens = undefined, max_completion_tokens = undefined } = options;
	const run = await client.beta.threads.runs.create(threadId, {
		assistant_id: resolvedAssistantId,
		instructions,
		additional_instructions,
		tools,
		metadata,
		model: model || (config.openai && config.openai.model) || undefined,
		response_format,
		temperature,
		top_p,
		max_prompt_tokens,
		max_completion_tokens
	});
	return run;
}

async function retrieveRun(threadId, runId) {
	console.log("retrieveRun called with:", { threadId, runId });
	ensureConfigured();
	if (!threadId) throw new Error('threadId is required');
	if (!runId) throw new Error('runId is required');
	
	console.log("About to call OpenAI API with:", { threadId, runId });
	console.log("threadId type:", typeof threadId, "value:", threadId);
	console.log("runId type:", typeof runId, "value:", runId);
	
	try {
		// Try with explicit parameter object
		const run = await client.beta.threads.runs.retrieve(threadId, runId);
		console.log("OpenAI API call successful, run status:", run.status);
		return run;
	} catch (error) {
		console.error("OpenAI API call failed:", error);
		console.error("Error details:", {
			message: error.message,
			name: error.name,
			code: error.code,
			status: error.status
		});
		throw error;
	}
}

async function listRuns(threadId, params = {}) {
	ensureConfigured();
	if (!threadId) throw new Error('threadId is required');
	const { limit = 20, order = 'desc', before = undefined, after = undefined } = params;
	const runs = await client.beta.threads.runs.list(threadId, { limit, order, before, after });
	return runs;
}

async function cancelRun(threadId, runId) {
	ensureConfigured();
	if (!threadId) throw new Error('threadId is required');
	if (!runId) throw new Error('runId is required');
	const cancelled = await client.beta.threads.runs.cancel(threadId, runId);
	return cancelled;
}

async function pollRunUntilTerminal(threadId, runId, options = {}) {
	console.log("pollRunUntilTerminal called with:", { threadId, runId, options });
	ensureConfigured();
	if (!threadId) throw new Error('threadId is required');
	if (!runId) throw new Error('runId is required');
	const { intervalMs = 1500, timeoutMs = 120000 } = options;
	const terminalStatuses = new Set(['completed', 'failed', 'cancelled', 'expired', 'requires_action']);
	const start = Date.now();
	while (true) {
		console.log("Calling retrieveRun with:", { threadId, runId });
		const run = await retrieveRun(threadId, runId);
		console.log("Retrieved run status:", run.status);
		if (terminalStatuses.has(run.status)) return run;
		if (Date.now() - start > timeoutMs) {
			throw new Error(`Polling timed out after ${timeoutMs}ms; last status: ${run.status}`);
		}
		await new Promise(r => setTimeout(r, intervalMs));
	}
}

async function sendMessageAndGetReply(params) {
	console.log("sendMessageAndGetReply called with:", params);
	ensureConfigured();
	const { content, threadId: providedThreadId = undefined, assistantId = undefined, createThreadMetadata = undefined, messageOptions = undefined, runOptions = undefined } = params || {};
	if (!content) throw new Error('content is required');
	
	const thread = providedThreadId ? { id: providedThreadId } : await createThread(createThreadMetadata);
	const threadId = thread.id;
	console.log("Using threadId:", threadId);
	
	await addMessageToThread(threadId, content, 'user', messageOptions);
	console.log("Message added to thread");
	
	const run = await createRun(threadId, assistantId, runOptions);
	console.log("Run created with ID:", run.id);
	
	if (!run.id) {
		throw new Error('Run ID is undefined');
	}
	
	console.log("Calling pollRunUntilTerminal with:", { threadId, runId: run.id });
	const finalRun = await pollRunUntilTerminal(threadId, run.id, { intervalMs: 1500, timeoutMs: 180000 });
	console.log("Polling completed, fetching messages");
	
	const msgs = await listMessages(threadId, { limit: 1, order: 'desc' });
	let latestAssistantText = '';
	if (msgs && msgs.data && msgs.data.length > 0) {
		const latestMessage = msgs.data[0];
		const textPart = latestMessage.content?.find(p => p.type === 'text');
		latestAssistantText = textPart?.text?.value || '';
	}
	console.log("Latest assistant text:", latestAssistantText);
	return { threadId, run: finalRun, reply: latestAssistantText, messages: msgs };
}

module.exports = {
	createThread,
	addMessageToThread,
	listMessages,
	createRun,
	retrieveRun,
	listRuns,
	cancelRun,
	pollRunUntilTerminal,
	sendMessageAndGetReply
}; 