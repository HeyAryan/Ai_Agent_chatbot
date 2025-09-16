async function listFaq(req, res) {
	return res.json({ success: true, data: [
		{ q: 'What is AI Hub?', a: 'A platform for AI assistants.' },
		{ q: 'How to subscribe?', a: 'Choose a plan and pay.' }
	]});
}

module.exports = { listFaq };


