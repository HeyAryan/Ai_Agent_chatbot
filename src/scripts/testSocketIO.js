const { io } = require('socket.io-client');

// Test script for Socket.IO integration
async function testSocketIO() {
	console.log('🧪 Testing Socket.IO Integration...\n');

	// 1. Get connection information
	console.log('1. Getting WebSocket connection information...');
	try {
		const response = await fetch('http://localhost:3000/app/get-connection-id');
		const data = await response.json();
		console.log('✅ Connection info received:', data.data.websocketUrl);
	} catch (error) {
		console.error('❌ Failed to get connection info:', error.message);
		return;
	}

	// 2. Test WebSocket connection (requires valid JWT token)
	console.log('\n2. Testing WebSocket connection...');
	console.log('⚠️  Note: This requires a valid JWT token from authentication');
	
	// Example connection (replace with actual JWT token)
	const testToken = 'your-jwt-token-here';
	
	if (testToken === 'your-jwt-token-here') {
		console.log('⚠️  Skipping WebSocket test - please provide a valid JWT token');
		console.log('   To test WebSocket connection:');
		console.log('   1. Authenticate via POST /auth/google');
		console.log('   2. Use the returned token in this test script');
		console.log('   3. Replace testToken variable with actual token');
		return;
	}

	const socket = io('http://localhost:3000', {
		auth: {
			token: testToken
		}
	});

	// Connection events
	socket.on('connect', () => {
		console.log('✅ Connected to WebSocket server');
		console.log('   Socket ID:', socket.id);
		
		// Test notification:get
		console.log('\n3. Testing notification:get...');
		socket.emit('notification:get', {});
	});

	socket.on('notification:receive', (data) => {
		console.log('✅ notification:receive received:', {
			success: data.success,
			notificationCount: data.data?.length || 0
		});
		
		// Test connection:get
		console.log('\n4. Testing connection:get...');
		socket.emit('connection:get', {});
	});

	socket.on('connection:receive', (data) => {
		console.log('✅ connection:receive received:', {
			success: data.success,
			totalConnections: data.totalConnections
		});
		
		// Test conversation:get
		console.log('\n5. Testing conversation:get...');
		socket.emit('conversation:get', {});
	});

	socket.on('conversation:receive', (data) => {
		console.log('✅ conversation:receive received:', {
			success: data.success,
			conversationCount: data.data?.length || 0
		});
		
		// Test message:send
		console.log('\n6. Testing message:send...');
		socket.emit('message:send', {
			conversationId: 'test-conversation-id',
			targetUserId: 'test-target-user',
			content: 'Test message from Socket.IO integration'
		});
	});

	socket.on('message:receive', (data) => {
		console.log('✅ message:receive received:', {
			success: data.success,
			messageId: data.data?._id
		});
		
		console.log('\n🎉 All Socket.IO tests completed successfully!');
		socket.disconnect();
	});

	socket.on('disconnect', () => {
		console.log('✅ Disconnected from WebSocket server');
	});

	socket.on('connect_error', (error) => {
		console.error('❌ Connection error:', error.message);
	});

	// Timeout after 10 seconds
	setTimeout(() => {
		if (socket.connected) {
			console.log('\n⏰ Test timeout - disconnecting...');
			socket.disconnect();
		}
	}, 10000);
}

// Run test if called directly
if (require.main === module) {
	testSocketIO().catch(console.error);
}

module.exports = { testSocketIO };
