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
	ensureConfigured();
	if (!threadId) throw new Error('threadId is required');
	const resolvedAssistantId = assistantId || process.env.OPENAI_ASSISTANT_ID || (config.openai && config.openai.assistantId) || undefined;
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
	ensureConfigured();
	if (!threadId) throw new Error('threadId is required');
	if (!runId) throw new Error('runId is required');
	const run = await client.beta.threads.runs.retrieve(threadId, runId);
	return run;
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
	ensureConfigured();
	if (!threadId) throw new Error('threadId is required');
	if (!runId) throw new Error('runId is required');
	const { intervalMs = 1500, timeoutMs = 120000 } = options;
	const terminalStatuses = new Set(['completed', 'failed', 'cancelled', 'expired', 'requires_action']);
	const start = Date.now();
	while (true) {
		const run = await retrieveRun(threadId, runId);
		if (terminalStatuses.has(run.status)) return run;
		if (Date.now() - start > timeoutMs) {
			throw new Error(`Polling timed out after ${timeoutMs}ms; last status: ${run.status}`);
		}
		await new Promise(r => setTimeout(r, intervalMs));
	}
}

async function sendMessageAndGetReply(params) {
	ensureConfigured();
	const { content, threadId: providedThreadId = undefined, assistantId = undefined, createThreadMetadata = undefined, messageOptions = undefined, runOptions = undefined } = params || {};
	if (!content) throw new Error('content is required');
	const thread = providedThreadId ? { id: providedThreadId } : await createThread(createThreadMetadata);
	const threadId = thread.id;
	await addMessageToThread(threadId, content, 'user', messageOptions);
	const run = await createRun(threadId, assistantId, runOptions);
	const finalRun = await pollRunUntilTerminal(threadId, run.id, { intervalMs: 1500, timeoutMs: 180000 });
	const msgs = await listMessages(threadId, { limit: 1, order: 'desc' });
	let latestAssistantText = '';
	if (msgs && msgs.data && msgs.data.length > 0) {
		const latestMessage = msgs.data[0];
		const textPart = latestMessage.content?.find(p => p.type === 'text');
		latestAssistantText = textPart?.text?.value || '';
	}
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