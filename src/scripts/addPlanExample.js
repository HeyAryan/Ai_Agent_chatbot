// Example: Add a new plan using the API
const addPlanViaAPI = async () => {
  const response = await fetch('http://localhost:3000/payments/plans', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      plan: 'Premium',
      amount: 999,
      currency: 'INR',
      billingCycle: 'monthly',
      features: [
        'Unlimited AI conversations',
        'Advanced AI agents',
        'Priority support',
        'Custom AI training',
        'API access',
        'Advanced analytics'
      ]
    })
  });
  
  const result = await response.json();
  console.log('Plan created:', result);
};

// Example: Update an existing plan
const updatePlanViaAPI = async (planId) => {
  const response = await fetch(`http://localhost:3000/payments/plans/${planId}`, {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: 799, // Updated price
      features: [
        'Unlimited AI conversations',
        'Advanced AI agents',
        'Priority support',
        'Custom AI training',
        'API access',
        'Advanced analytics',
        'White-label solution' // New feature
      ]
    })
  });
  
  const result = await response.json();
  console.log('Plan updated:', result);
};
