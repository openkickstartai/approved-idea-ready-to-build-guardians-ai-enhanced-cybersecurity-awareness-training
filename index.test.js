const request = require('supertest');
const app = require('./index');

describe('Express API Integration Tests', () => {

  // ─── GET / ────────────────────────────────────────────────────────
  describe('GET /', () => {
    test('returns 200 with HTML containing Guardians title', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Guardians');
      expect(res.headers['content-type']).toMatch(/html/);
    });

    test('HTML includes cybersecurity training description', async () => {
      const res = await request(app).get('/');
      expect(res.text).toContain('Cybersecurity Awareness Training');
    });
  });

  // ─── GET /api/scenarios ───────────────────────────────────────────
  describe('GET /api/scenarios', () => {
    test('returns 200 with a non-empty JSON array', async () => {
      const res = await request(app).get('/api/scenarios');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('each scenario has id, category, title, description, and options', async () => {
      const res = await request(app).get('/api/scenarios');
      res.body.forEach(scenario => {
        expect(scenario).toHaveProperty('id');
        expect(scenario).toHaveProperty('category');
        expect(scenario).toHaveProperty('title');
        expect(scenario).toHaveProperty('description');
        expect(Array.isArray(scenario.options)).toBe(true);
        expect(scenario.options.length).toBeGreaterThanOrEqual(3);
      });
    });

    test('scenario options do NOT expose score or feedback (information leak prevention)', async () => {
      const res = await request(app).get('/api/scenarios');
      res.body.forEach(scenario => {
        scenario.options.forEach(opt => {
          expect(opt).toHaveProperty('id');
          expect(opt).toHaveProperty('text');
          expect(opt.score).toBeUndefined();
          expect(opt.feedback).toBeUndefined();
        });
      });
    });
  });

  // ─── POST /api/evaluate — valid payloads ──────────────────────────
  describe('POST /api/evaluate — valid payloads', () => {
    test('returns 200 with risk profile for valid answers', async () => {
      const res = await request(app)
        .post('/api/evaluate')
        .set('Content-Type', 'application/json')
        .send({
          answers: [
            { scenarioId: 'phishing-01', choiceId: 'b' },
            { scenarioId: 'password-01', choiceId: 'b' },
          ],
        });
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toHaveProperty('overallScore');
      expect(res.body).toHaveProperty('level');
      expect(res.body).toHaveProperty('recommendations');
      expect(typeof res.body.overallScore).toBe('number');
    });

    test('returns Security Champion for all-best answers', async () => {
      const res = await request(app)
        .post('/api/evaluate')
        .send({
          answers: [
            { scenarioId: 'phishing-01', choiceId: 'b' },
            { scenarioId: 'password-01', choiceId: 'b' },
            { scenarioId: 'social-01', choiceId: 'b' },
          ],
        });
      expect(res.status).toBe(200);
      expect(res.body.overallScore).toBe(100);
      expect(res.body.level).toBe('Security Champion');
      expect(res.body.recommendations).toHaveLength(0);
    });

    test('returns low score with recommendations for poor choices', async () => {
      const res = await request(app)
        .post('/api/evaluate')
        .send({
          answers: [
            { scenarioId: 'phishing-01', choiceId: 'a' },
            { scenarioId: 'password-01', choiceId: 'c' },
          ],
        });
      expect(res.status).toBe(200);
      expect(res.body.overallScore).toBeLessThanOrEqual(10);
      expect(res.body.recommendations.length).toBeGreaterThan(0);
    });

    test('gracefully handles answers with non-existent scenarioIds', async () => {
      const res = await request(app)
        .post('/api/evaluate')
        .send({
          answers: [
            { scenarioId: 'does-not-exist', choiceId: 'a' },
          ],
        });
      // evaluateAnswers skips unknowns, generateProfile still returns a profile
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('overallScore');
      expect(res.body).toHaveProperty('level');
    });

    test('profile contains per-result feedback entries', async () => {
      const res = await request(app)
        .post('/api/evaluate')
        .send({
          answers: [
            { scenarioId: 'phishing-01', choiceId: 'b' },
          ],
        });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('results');
      if (res.body.results) {
        expect(Array.isArray(res.body.results)).toBe(true);
      }
    });
  });

  // ─── POST /api/evaluate — invalid / malicious payloads ────────────
  describe('POST /api/evaluate — invalid payloads', () => {
    test('returns 400 when body is empty', async () => {
      const res = await request(app)
        .post('/api/evaluate')
        .set('Content-Type', 'application/json')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error.length).toBeGreaterThan(0);
    });

    test('returns 400 when answers is missing entirely', async () => {
      const res = await request(app)
        .post('/api/evaluate')
        .send({ foo: 'bar' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('returns 400 when answers is not an array (string)', async () => {
      const res = await request(app)
        .post('/api/evaluate')
        .send({ answers: 'not-an-array' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/array/i);
    });

    test('returns 400 when answers is not an array (number)', async () => {
      const res = await request(app)
        .post('/api/evaluate')
        .send({ answers: 42 });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('returns 400 when answers is not an array (object)', async () => {
      const res = await request(app)
        .post('/api/evaluate')
        .send({ answers: { scenarioId: 'phishing-01', choiceId: 'b' } });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('returns 400 when answers is an empty array', async () => {
      const res = await request(app)
        .post('/api/evaluate')
        .send({ answers: [] });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('returns 400 when answers is null', async () => {
      const res = await request(app)
        .post('/api/evaluate')
        .send({ answers: null });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('returns 400 when no body is sent at all', async () => {
      const res = await request(app)
        .post('/api/evaluate');
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('does not crash with injection-style scenarioId values', async () => {
      const res = await request(app)
        .post('/api/evaluate')
        .send({
          answers: [
            { scenarioId: '<script>alert(1)</script>', choiceId: 'b' },
            { scenarioId: '\'; DROP TABLE scenarios;--', choiceId: 'a' },
            { scenarioId: '../../../etc/passwd', choiceId: 'c' },
          ],
        });
      // Must not crash — unknown IDs are simply skipped
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('overallScore');
    });
  });

  // ─── 404 — undefined routes ───────────────────────────────────────
  describe('Undefined routes return 404', () => {
    test('GET /api/nonexistent returns 404', async () => {
      const res = await request(app).get('/api/nonexistent');
      expect(res.status).toBe(404);
    });

    test('POST /api/scenarios returns 404 (wrong method)', async () => {
      const res = await request(app).post('/api/scenarios');
      expect(res.status).toBe(404);
    });

    test('GET /api/evaluate returns 404 (wrong method)', async () => {
      const res = await request(app).get('/api/evaluate');
      expect(res.status).toBe(404);
    });

    test('GET /random/path returns 404', async () => {
      const res = await request(app).get('/random/path');
      expect(res.status).toBe(404);
    });

    test('PUT /api/evaluate returns 404', async () => {
      const res = await request(app).put('/api/evaluate');
      expect(res.status).toBe(404);
    });

    test('DELETE /api/scenarios returns 404', async () => {
      const res = await request(app).delete('/api/scenarios');
      expect(res.status).toBe(404);
    });
  });

  // ─── Content-Type & Headers ───────────────────────────────────────
  describe('Response headers', () => {
    test('GET /api/scenarios returns application/json content-type', async () => {
      const res = await request(app).get('/api/scenarios');
      expect(res.headers['content-type']).toMatch(/application\/json/);
    });

    test('POST /api/evaluate with valid data returns application/json', async () => {
      const res = await request(app)
        .post('/api/evaluate')
        .send({ answers: [{ scenarioId: 'phishing-01', choiceId: 'b' }] });
      expect(res.headers['content-type']).toMatch(/application\/json/);
    });

    test('POST /api/evaluate error response is also JSON', async () => {
      const res = await request(app)
        .post('/api/evaluate')
        .send({ answers: [] });
      expect(res.headers['content-type']).toMatch(/application\/json/);
    });
  });
});
