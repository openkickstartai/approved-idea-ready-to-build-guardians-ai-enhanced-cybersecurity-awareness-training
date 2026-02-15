const scenarios = [
  {
    id: 'phishing-01', category: 'phishing', title: 'Suspicious Email',
    description: 'You receive an email from "IT-Support@y0urcompany.co" asking you to reset your password via a link.',
    options: [
      { id: 'a', text: 'Click the link and reset password', score: 0, feedback: 'Never click links from unverified senders.' },
      { id: 'b', text: 'Report to IT security and delete', score: 100, feedback: 'Reporting suspicious emails protects everyone.' },
      { id: 'c', text: 'Ignore and delete without reporting', score: 40, feedback: 'Safe for you, but reporting helps protect others too.' },
    ],
  },
  {
    id: 'password-01', category: 'passwords', title: 'Password Choice',
    description: 'Your company requires a new password. Which approach do you choose?',
    options: [
      { id: 'a', text: 'Use "Company2024!"', score: 10, feedback: 'Predictable patterns with company name are easily guessed.' },
      { id: 'b', text: 'Use a password manager to generate one', score: 100, feedback: 'Best practice! Unique strong passwords for every account.' },
      { id: 'c', text: 'Reuse your personal email password', score: 0, feedback: 'One breach compromises all your accounts.' },
    ],
  },
  {
    id: 'social-01', category: 'social_engineering', title: 'Unexpected Phone Call',
    description: 'Someone calls claiming to be from your bank, asking to verify your account number and PIN.',
    options: [
      { id: 'a', text: 'Provide the information they ask for', score: 0, feedback: 'Never share sensitive info on inbound calls.' },
      { id: 'b', text: 'Hang up and call the official bank number', score: 100, feedback: 'Always verify through official channels yourself.' },
      { id: 'c', text: 'Ask them security questions first', score: 30, feedback: 'Scammers can fabricate answers. Call back on a verified number.' },
    ],
  },
  {
    id: 'wifi-01', category: 'network', title: 'Public Wi-Fi',
    description: 'You need to check your bank account at a coffee shop with free Wi-Fi.',
    options: [
      { id: 'a', text: 'Connect to Wi-Fi and log in directly', score: 0, feedback: 'Public Wi-Fi can be intercepted by attackers.' },
      { id: 'b', text: 'Use a VPN then log in', score: 100, feedback: 'VPNs encrypt your traffic on untrusted networks.' },
      { id: 'c', text: 'Use your mobile hotspot instead', score: 90, feedback: 'Cellular data is more secure than public Wi-Fi.' },
    ],
  },
  {
    id: 'usb-01', category: 'physical', title: 'Found USB Drive',
    description: 'You find a USB drive labeled "Salary Report Q4" in the parking lot.',
    options: [
      { id: 'a', text: 'Plug it in to find the owner', score: 0, feedback: 'USB drops are a classic attack vector. Never plug in unknown devices.' },
      { id: 'b', text: 'Turn it in to the security team', score: 100, feedback: 'Let trained security staff handle unknown devices safely.' },
      { id: 'c', text: 'Throw it in the trash', score: 40, feedback: 'Avoids personal risk, but IT should analyze it for threats.' },
    ],
  },
];

function getScenarios() {
  return scenarios.map(({ id, category, title, description, options }) => ({
    id, category, title, description,
    options: options.map(({ id, text }) => ({ id, text })),
  }));
}

function getScenarioById(id) {
  return scenarios.find(s => s.id === id) || null;
}

function evaluateAnswers(answers) {
  const results = [];
  for (const { scenarioId, choiceId } of answers) {
    const scenario = getScenarioById(scenarioId);
    if (!scenario) continue;
    const chosen = scenario.options.find(o => o.id === choiceId);
    if (!chosen) continue;
    results.push({
      scenarioId, category: scenario.category, title: scenario.title,
      score: chosen.score, feedback: chosen.feedback,
    });
  }
  return results;
}

function generateProfile(results) {
  if (!results.length) return { overallScore: 0, level: 'Unknown', recommendations: [], details: [] };
  const total = results.reduce((sum, r) => sum + r.score, 0);
  const overallScore = Math.round(total / results.length);
  const weak = results.filter(r => r.score < 50).map(r => r.category);
  const level = overallScore >= 80 ? 'Security Champion'
    : overallScore >= 50 ? 'Developing Awareness' : 'Needs Training';
  const tips = {
    phishing: 'Take an advanced phishing recognition course.',
    passwords: 'Adopt a password manager for all accounts.',
    social_engineering: 'Practice verifying identities before sharing info.',
    network: 'Always use a VPN on untrusted networks.',
    physical: 'Report suspicious physical items to security immediately.',
  };
  const recommendations = [...new Set(weak)].map(c => tips[c] || 'Review general security guidelines.');
  return { overallScore, level, recommendations, details: results };
}

module.exports = { scenarios, getScenarios, getScenarioById, evaluateAnswers, generateProfile };
