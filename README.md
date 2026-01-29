# BizHealth Pipeline Worker

Background worker for processing BizHealth assessment questionnaires and generating comprehensive business reports.

## Supported Pipelines

### BIG Pipeline (Growth Plan - $299)
- **87 questions** across 12 business categories
- **17+ reports** generated
- **Full 5-phase processing** with deep analysis
- **30-45 minutes** processing time
- Includes Phase 2 (Comparative Analysis) and Phase 3 (Strategic Synthesis)

### LIL Pipeline (Essentials Plan - $99)
- **45 questions** across 12 business categories
- **8 reports** generated
- **Streamlined 4-phase processing** (skips Phase 2 & 3)
- **8-10 minutes** processing time
- 30-60-90 day roadmap focus

## Reports Generated

### BIG Pipeline Reports (17+)
1. Comprehensive Business Health Report
2. Executive Brief
3. Executive Overview
4. Owner's Report
5. Manager's Strategy Report
6. Manager's Sales & Marketing Report
7. Manager's Operations Report
8. Manager's IT & Technology Report
9. Manager's Financials Report
10. Manager's Human Resources Report
11. Manager's Leadership & Governance Report
12. Manager's Risk Management Report
13. Manager's Compliance Report
14. Manager's Technology & Innovation Report
15. Manager's Customer Experience Report
16. Employees Report
17. Action Plan Report

### LIL Pipeline Reports (8)
1. Comprehensive Business Health Report
2. Owner's Strategic Report
3. Manager's Strategy Report
4. Manager's Sales & Marketing Report
5. Manager's Operations Report
6. Manager's IT & Technology Report
7. Manager's Financials Report
8. Employees Report

## Environment Variables

```env
SUPABASE_URL=https://jksqdjauzohieghijkam.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-api-key
POLL_INTERVAL_MS=10000
PORT=3000
```

## Deployment on Render

### Build Command
```bash
npm install && npm run build
```

### Start Command
```bash
npm run worker
```

### Instance Type
- **Starter ($7/month)** - Recommended for low volume
- **Standard ($25/month)** - For higher concurrent processing

## How It Works

1. Worker polls `pipeline_queue` table every 10 seconds
2. Picks up pending jobs ordered by creation time
3. Determines pipeline type (BIG or LIL) from job data
4. Runs appropriate pipeline phases
5. Saves generated reports to `reports` table
6. Updates job status to completed/failed

## API Endpoints

- `GET /` - Service status
- `GET /health` - Health check
- `POST /trigger` - Manually trigger a job
- `GET /status/:jobId` - Get job status

## Local Development

```bash
# Install dependencies
npm install

# Run the worker locally
npm run worker

# Run the full pipeline on a test file
npm run pipeline -- --input test-data.json --output ./output
```

## Architecture

```
src/
├── render-worker.ts       # Main worker entry point
├── run-pipeline.ts        # BIG pipeline runner
├── orchestration/
│   ├── lil/               # LIL pipeline orchestrators
│   │   ├── lil-pipeline-orchestrator.ts
│   │   ├── phase0-lil-orchestrator.ts
│   │   ├── phase1-lil-orchestrator.ts
│   │   ├── phase1-5-lil-orchestrator.ts
│   │   ├── phase4-lil-orchestrator.ts
│   │   ├── phase4-5-lil-orchestrator.ts
│   │   └── phase5-lil-orchestrator.ts
│   └── ...                # BIG pipeline orchestrators
├── config/
│   ├── pipeline.config.ts # BIG pipeline config
│   └── lil-pipeline.config.ts # LIL pipeline config
├── data/
│   ├── question-category-mapping.ts # BIG questions
│   └── question-category-mapping-lil.ts # LIL questions
└── types/
    ├── pipeline.types.ts  # BIG pipeline types
    └── lil-pipeline.types.ts # LIL pipeline types
```

## License

Proprietary - BizHealth.ai
