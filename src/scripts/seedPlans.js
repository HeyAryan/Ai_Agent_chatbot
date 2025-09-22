const mongoose = require('mongoose');
const config = require('../config');
const { Plan } = require('../models');

// Connect to MongoDB
mongoose.connect(config.mongo.uri)
	.then(() => {
		console.log('Connected to MongoDB');
		return seedPlans();
	})
	.then(() => {
		console.log('Plans seeded successfully');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Error:', error);
		process.exit(1);
	});

async function seedPlans() {
	// Clear existing plans
	await Plan.deleteMany({});

	// Create sample plans
	const plans = [
		{
			plan: 'Basic',
			amount: 299, // ₹299
			currency: 'INR',
			billingCycle: 'monthly',
			features: [
				'5 AI conversations per day',
				'Basic AI agents',
				'Email support',
				'Standard response time'
			]
		},
		{
			plan: 'Pro',
			amount: 599, // ₹599
			currency: 'INR',
			billingCycle: 'monthly',
			features: [
				'Unlimited AI conversations',
				'Advanced AI agents',
				'Priority support',
				'Custom AI training',
				'API access'
			]
		},
		{
			plan: 'Enterprise',
			amount: 1299, // ₹1299
			currency: 'INR',
			billingCycle: 'monthly',
			features: [
				'Everything in Pro',
				'White-label solution',
				'Dedicated support',
				'Custom integrations',
				'Advanced analytics',
				'Team management'
			]
		},
		{
			plan: 'Basic Yearly',
			amount: 2999, // ₹2999 (save ₹589)
			currency: 'INR',
			billingCycle: 'yearly',
			features: [
				'5 AI conversations per day',
				'Basic AI agents',
				'Email support',
				'Standard response time',
				'20% discount on yearly billing'
			]
		},
		{
			plan: 'Pro Yearly',
			amount: 5999, // ₹5999 (save ₹1189)
			currency: 'INR',
			billingCycle: 'yearly',
			features: [
				'Unlimited AI conversations',
				'Advanced AI agents',
				'Priority support',
				'Custom AI training',
				'API access',
				'20% discount on yearly billing'
			]
		}
	];

	await Plan.insertMany(plans);
	console.log(`Created ${plans.length} plans`);
}
