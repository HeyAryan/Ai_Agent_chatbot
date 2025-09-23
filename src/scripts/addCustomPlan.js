const mongoose = require('mongoose');
const config = require('../config');
const { Plan } = require('../models');

// Connect to MongoDB
mongoose.connect(config.mongo.uri)
  .then(() => {
    console.log('Connected to MongoDB');
    return addCustomPlan();
  })
  .then(() => {
    console.log('Custom plan added successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

async function addCustomPlan() {
  // Add a single custom plan
  const customPlan = new Plan({
    plan: 'Starter',
    amount: 199, // ₹199
    currency: 'INR',
    billingCycle: 'monthly',
    features: [
      '3 AI conversations per day',
      'Basic AI agents',
      'Email support',
      'Standard response time'
    ]
  });

  await customPlan.save();
  console.log('Custom plan created:', customPlan);
}

// You can also add multiple plans at once
async function addMultiplePlans() {
  const plans = [
    {
      plan: 'Student',
      amount: 149,
      currency: 'INR',
      billingCycle: 'monthly',
      features: [
        '2 AI conversations per day',
        'Basic AI agents',
        'Email support',
        'Student discount'
      ]
    },
    {
      plan: 'Business',
      amount: 1999,
      currency: 'INR',
      billingCycle: 'monthly',
      features: [
        'Unlimited AI conversations',
        'Advanced AI agents',
        'Priority support',
        'Custom AI training',
        'API access',
        'Team management',
        'Advanced analytics',
        'White-label solution'
      ]
    }
  ];

  await Plan.insertMany(plans);
  console.log(`Added ${plans.length} plans`);
}
