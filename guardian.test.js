const request = require('supertest');
const app = require('./index');
const { getScenarios, getScenarioById, evaluateAnswers, generateProfile } = require('./guardian');

describe('Guardian Core Engine', () => {
  test('getScenarios hides scores and feedback from clients', () => {
    const list = getScenarios();
    expect(list.length).toBe(5);
    list.forEach(s => {
      expect(s.id).toBeDefined();
      expect(s.options.length).toBeGreaterThanOrEqual(3);
      s.options.forEach(o => {
        expect(o.score).toBeUndefined();
        expect(o.feedback).toBeUndefined();
      });
    });
  });

  test('getScenarioById returns correct scenario or null', () => {
    expect(getScenarioById('phishing-01').title).toBe('Suspicious Email');
    expect(getScenarioById('nonexistent')).toBeNull();
  });

  test('evaluateAnswers scores correctly and skips invalid entries', () => {
    const results = evaluateAnswers([
      { scenarioId: 'phishing-01', choiceId: 'b' },
      { scenarioId: 'fake-id', choiceId: 'a' },
      { scenarioId: 'password-01', choiceId: 'c' },
    ]);
    expect(results.length).toBe(2);
    expect(results[0].score).toBe(100);
    expect(results[1].score).toBe(0);
  });

  test('generateProfile produces Security Champion for high scores', () => {
    const results = evaluateAnswers([
      { scenarioId: 'phishing-01', choiceId: 'b' },
      { scenarioId: 'password-01', choiceId: 'b' },
      { scenarioId: 'social-01', choiceId: 'b' },
    ]);
    const profile = generateProfile(results);
    expect(profile.overallScore).toBe(100);
    expect(profile.level).toBe('Security Champion');
    expect(profile.recommendations).toHaveLength(0);
  });

  test('generateProfile produces Needs Training for low scores with recommendations', () => {
    const results = evaluateAnswers([
      { scenarioId: 'phishing-01', choiceId: 'a' },
      { scenarioId: 'password-01', choiceId: 'c' },
      { scenarioId: 'social-01', choiceId: 'a' },
    ]);
    const profile = generateProfile(results);
    expect(profile.overallScore).toBe(0);
    expect(profile.level).toBe('Needs Training');
    expect(profile.recommendations.length).toBe(3);
  });
});

describe('Guardians REST API', () => {
  test('GET /api/scenarios returns 200 with scenario list', async () => {
    const res = await request(app).get('/api/scenarios');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(5);
  });

  test('POST /api/evaluate returns profile for valid answers', async () => {
    const res = await request(app).post('/api/evaluate').send({
      answers: [
        { scenarioId: 'wifi-01', choiceId: 'b' },
        { scenarioId: 'usb-01', choiceId: 'b' },
      ],
    });
    expect(res.status).toBe(200);
    expect(res.body.overallScore).toBe(100);
    expect(res.body.level).toBe('Security Champion');
    expect(res.body.details).toHaveLength(2);
  });

  test('POST /api/evaluate returns 400 for empty answers', async () => {
    const res = await request(app).post('/api/evaluate').send({ answers: [] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('GET / returns HTML page', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.type).toBe('text/html');
    expect(res.text).toContain('Guardians');
  });
});
