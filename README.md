# 🛡️ Guardians — AI-Enhanced Cybersecurity Awareness Training

Interactive web-based cybersecurity training platform with an AI-powered scoring engine that assesses security awareness through real-world scenarios and generates personalized risk profiles.

## Features

- **Scenario-Based Training** — Phishing, passwords, social engineering, network & physical security
- **AI Scoring Engine** — Intelligent evaluation with per-scenario feedback and risk profiling
- **Personalized Recommendations** — Targeted tips based on your weak areas
- **REST API** — Clean JSON endpoints for integration

## Quick Start

```bash
git clone https://github.com/openks/guardians.git
cd guardians
npm install
npm start
```

Open **http://localhost:3000** in your browser.

## API

### `GET /api/scenarios`

Returns all training scenarios (answer scores hidden).

### `POST /api/evaluate`

Submit answers and receive your security profile.

```json
{
  "answers": [
    { "scenarioId": "phishing-01", "choiceId": "b" },
    { "scenarioId": "password-01", "choiceId": "b" }
  ]
}
```

## Testing

```bash
npm test
```

## Contributing

1. Fork the repo
2. Add scenarios in `guardian.js`
3. Write tests, submit a PR

New contributors welcome! See open issues for good first tasks.

## License

MIT
