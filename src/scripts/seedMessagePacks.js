const mongoose = require('mongoose');
const { MessagePack } = require('../models');
const config = require('../config');

// Connect to MongoDB
mongoose.connect(config.mongoUri, {
	useNewUrlParser: true,
	useUnifiedTopology: true
});

const messagePacks = [
	{
		name: 'Starter Pack',
		description: 'Perfect for trying out our AI agents',
		messageCount: 30,
		price: 10,
		currency: 'INR',
		validityDays: 30,
		displayOrder: 1,
		features: ['30 messages', '30 days validity', 'All AI agents access'],
		tags: ['starter', 'popular']
	},
	{
		name: 'Basic Pack',
		description: 'Great for regular users',
		messageCount: 50,
		price: 15,
		currency: 'INR',
		validityDays: 30,
		displayOrder: 2,
		features: ['50 messages', '30 days validity', 'All AI agents access'],
		tags: ['basic', 'value']
	},
	{
		name: 'Premium Pack',
		description: 'Best value for heavy users',
		messageCount: 100,
		price: 25,
		currency: 'INR',
		validityDays: 30,
		displayOrder: 3,
		discount: {
			percentage: 10,
			originalPrice: 30
		},
		features: ['100 messages', '30 days validity', 'All AI agents access', 'Priority support'],
		tags: ['premium', 'best-value']
	},
	{
		name: 'Mega Pack',
		description: 'For power users and businesses',
		messageCount: 200,
		price: 45,
		currency: 'INR',
		validityDays: 60,
		displayOrder: 4,
		discount: {
			percentage: 15,
			originalPrice: 60
		},
		features: ['200 messages', '60 days validity', 'All AI agents access', 'Priority support', 'Advanced features'],
		tags: ['mega', 'business']
	},
	{
		name: 'Unlimited Pack',
		description: 'Unlimited messages for 30 days',
		messageCount: 1000,
		price: 99,
		currency: 'INR',
		validityDays: 30,
		displayOrder: 5,
		features: ['1000+ messages', '30 days validity', 'All AI agents access', 'Priority support', 'Advanced features', 'API access'],
		tags: ['unlimited', 'enterprise']
	}
];

async function seedMessagePacks() {
	try {
		console.log('Starting message pack seeding...');

		// Clear existing message packs
		await MessagePack.deleteMany({});
		console.log('Cleared existing message packs');

		// Insert new message packs
		const createdPacks = await MessagePack.insertMany(messagePacks);
		console.log(`Created ${createdPacks.length} message packs:`);

		createdPacks.forEach(pack => {
			console.log(`- ${pack.name}: ${pack.messageCount} messages for ₹${pack.price}`);
		});

		console.log('Message pack seeding completed successfully!');
	} catch (error) {
		console.error('Error seeding message packs:', error);
	} finally {
		mongoose.connection.close();
	}
}

// Run the seeding function
seedMessagePacks();
