const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const config = require('../config');
const { Conversation, Message } = require('../models');
const OpenAI = require('openai');

const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID || '';

function setupRealtime(server) {
	const io = new Server(server, {
		cors: { origin: '*', methods: ['GET', 'POST'] }
	});

  const guestConversations = new Map(); // socketId -> { id: string, threadId?: string }
  const conversationThreads = new Map(); // conversationId -> threadId (for authenticated users)

  async function ensureThreadIdForGuest(socketId) {
    console.log('[ws] ensureThreadIdForGuest called', { socketId });
    let entry = guestConversations.get(socketId);
    if (!entry) return null;
    if (!entry.threadId) {
      console.log('[openai] creating thread for guest');
      const thread = await openaiClient.beta.threads.create({});
      entry.threadId = thread.id;
      guestConversations.set(socketId, entry);
      console.log('[openai] created guest thread', { threadId: entry.threadId });
    }
    return entry.threadId;
  }

  async function ensureThreadIdForConversation(conversationId) {
    console.log('[ws] ensureThreadIdForConversation called', { conversationId });
    let threadId = conversationThreads.get(conversationId);
    if (!threadId) {
      console.log('[openai] creating thread for conversation');
      const thread = await openaiClient.beta.threads.create({});
      threadId = thread.id;
      conversationThreads.set(conversationId, threadId);
      console.log('[openai] created conversation thread', { conversationId, threadId });
    }
    return threadId;
  }

  async function runAssistantAndStreamReply(threadId, conversationId, socket) {
    const startRunMs = Date.now();
    console.log('[openai] starting streaming run', { threadId, assistantId: ASSISTANT_ID });
    
    const run = await openaiClient.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID,
      stream: true
    });

    let fullResponse = '';
    let firstChunkTime = null;

    for await (const event of run) {
      console.log('[openai] stream event', { threadId, eventType: event.event, status: event.data?.status });
      
      if (event.event === 'thread.message.delta') {
        if (!firstChunkTime) {
          firstChunkTime = Date.now();
          const firstChunkSec = ((firstChunkTime - startRunMs) / 1000).toFixed(2);
          console.log('[openai] first chunk received', { threadId, seconds: firstChunkSec });
        }
        
        const delta = event.data.delta;
        if (delta.content && delta.content[0]?.type === 'text') {
          const chunk = delta.content[0].text.value;
          fullResponse += chunk;
          
          // Emit partial response to frontend
          socket.emit('assistant_chunk', { 
            conversationId, 
            chunk, 
            fullText: fullResponse,
            isComplete: false 
          });
        }
      }
      
      if (event.event === 'thread.message.completed') {
        const totalSec = ((Date.now() - startRunMs) / 1000).toFixed(2);
        console.log('[openai] streaming complete', { threadId, length: fullResponse.length, totalSeconds: totalSec });
        
        // Emit final complete response
        socket.emit('assistant_chunk', { 
          conversationId, 
          chunk: '', 
          fullText: fullResponse,
          isComplete: true 
        });
        
        return fullResponse;
      }
      
      if (event.event === 'thread.run.failed') {
        console.warn('[openai] run failed', { threadId, error: event.data.last_error });
        throw new Error(`Assistant run failed: ${event.data.last_error?.message || 'Unknown error'}`);
      }
    }
    
    return fullResponse;
  }

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers['authorization']?.replace('Bearer ', '');
      if (!token) {
        if (config.nodeEnv !== 'production') {
          // Dev mode: allow guest user using socket id
          socket.user = { id: `guest:${socket.id}`, email: undefined, role: 'guest' };
          console.log('[ws] guest connection allowed', { socketId: socket.id });
          return next();
        }
        return next(new Error('Unauthorized'));
      }
      const payload = jwt.verify(token, config.jwt.secret);
      socket.user = { id: payload.userId, email: payload.email, role: payload.role };
      console.log('[ws] auth connection', { userId: socket.user.id });
      return next();
    } catch (err) {
      if (config.nodeEnv !== 'production') {
        socket.user = { id: `guest:${socket.id}`, email: undefined, role: 'guest' };
        console.log('[ws] guest connection on error', { socketId: socket.id, error: err?.message });
        return next();
      }
      return next(new Error('Unauthorized'));
    }
  });

	io.on('connection', (socket) => {
		// join a conversation room
		socket.on('join', async ({ conversationId }) => {
			try {
				const conv = await Conversation.findOne({ _id: conversationId, userId: socket.user.id }).lean().exec();
				if (!conv) return socket.emit('error', { message: 'Conversation not found' });
				socket.join(`conv:${conversationId}`);
				socket.emit('joined', { conversationId });
			} catch (err) {
				socket.emit('error', { message: 'Failed to join' });
			}
		});

    // create or return a conversation to start chatting
    socket.on('start', async ({ title }) => {
      try {
        console.log('[ws] start received', { user: socket.user?.id, role: socket.user?.role, title });
        if (socket.user.role === 'guest') {
          const conversationId = `guest-conv:${socket.id}`;
          guestConversations.set(socket.id, { id: conversationId });
          socket.join(`conv:${conversationId}`);
          socket.emit('started', { conversationId });
          console.log('[ws] guest started', { conversationId });
        } else {
          let conv = await Conversation.findOne({ userId: socket.user.id }).sort({ createdAt: 1 }).exec();
          if (!conv) {
            // Note: agentId may be required in schema; ensure your schema allows null/optional or set a default agent elsewhere.
            conv = await Conversation.create({ userId: socket.user.id, title: title || 'New Chat' });
          }
          const conversationId = conv._id.toString();
          socket.join(`conv:${conversationId}`);
          socket.emit('started', { conversationId });
          console.log('[ws] auth started', { conversationId, userId: socket.user.id });
        }
      } catch (err) {
        console.error('[ws] start error', err);
        socket.emit('error', { message: 'Failed to start chat' });
      }
    });

    // send message
    socket.on('message', async ({ conversationId, content }) => {
			try {
        console.log('[ws] message received', { conversationId, user: socket.user?.id, len: content?.length });
        if (socket.user.role === 'guest') {
          // Guests: use Assistants threads in-memory
          if (!openaiClient.apiKey || !ASSISTANT_ID) {
            return socket.emit('error', { message: 'Assistant not configured. Set OPENAI_API_KEY and OPENAI_ASSISTANT_ID.' });
          }
          const guest = guestConversations.get(socket.id);
          if (!guest || guest.id !== conversationId) return socket.emit('error', { message: 'Conversation not found' });
          io.to(`conv:${conversationId}`).emit('message', { conversationId, sender: 'user', content, createdAt: new Date().toISOString() });

          const threadId = await ensureThreadIdForGuest(socket.id);
          console.log('[openai] append user message to guest thread', { threadId });
          const t0 = Date.now();
          await openaiClient.beta.threads.messages.create(threadId, { role: 'user', content });
          const assistantText = await runAssistantAndStreamReply(threadId, conversationId, socket);
          const totalSec = ((Date.now() - t0) / 1000).toFixed(2);
          console.log('[openai] total time guest (append+stream)', { threadId, seconds: totalSec });
          // Final message already emitted via streaming
          console.log('[ws] assistant message emitted (guest)', { conversationId, length: assistantText.length });
        } else {
          // Persisted flow: save user message, use Assistants thread per conversation
          if (!openaiClient.apiKey || !ASSISTANT_ID) {
            return socket.emit('error', { message: 'Assistant not configured. Set OPENAI_API_KEY and OPENAI_ASSISTANT_ID.' });
          }
          const conv = await Conversation.findOne({ _id: conversationId, userId: socket.user.id }).exec();
          if (!conv) return socket.emit('error', { message: 'Conversation not found' });
          const msg = await Message.create({ conversationId, sender: 'user', senderId: socket.user.id, content });
          await Conversation.findByIdAndUpdate(conversationId, { lastMessage: content, updatedAt: new Date() }).exec();
          io.to(`conv:${conversationId}`).emit('message', { _id: msg._id, conversationId, sender: 'user', content, createdAt: msg.createdAt });

          const threadId = await ensureThreadIdForConversation(conversationId);
          console.log('[openai] append user message to conversation thread', { conversationId, threadId });
          const t0 = Date.now();
          await openaiClient.beta.threads.messages.create(threadId, { role: 'user', content });
          const assistantText = await runAssistantAndStreamReply(threadId, conversationId, socket);
          const totalSec = ((Date.now() - t0) / 1000).toFixed(2);
          console.log('[openai] total time auth (append+stream)', { conversationId, threadId, seconds: totalSec });
          const bot = await Message.create({ conversationId, sender: 'agent', senderId: 'assistant', content: assistantText });
          await Conversation.findByIdAndUpdate(conversationId, { lastMessage: assistantText, updatedAt: new Date() }).exec();
          // Final message already emitted via streaming, just emit the persisted version
          socket.emit('message', { _id: bot._id, conversationId, sender: 'assistant', content: assistantText, createdAt: bot.createdAt });
          console.log('[ws] assistant message emitted (auth)', { conversationId, length: assistantText.length });
        }
			} catch (err) {
        console.error('[ws] message error', err);
        socket.emit('error', { message: 'Failed to send' });
			}
		});
	});

	return io;
}

module.exports = { setupRealtime };



