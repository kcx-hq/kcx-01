# Project Structure — KCX-01

A **Cloud Cost Management / FinOps** monorepo with a React (Vite) frontend and Node.js/Express backend. This document describes every file and folder in the project, excluding `node_modules`, `.git`, `dist`, and similar generated/cache directories.

---

## Root

| File | Description |
|------|-------------|
| `.gitignore` | Ignores node_modules, dist, .env, logs, IDE files, etc. |
| `AdminPanel.md` | Admin panel documentation |
| `DEPLOYMENT.md` | Render deployment guide |
| `INGESTION_PROD_PLAN.md` | Production billing ingestion plan |
| `PROJECTSCOPE.md` | Project scope and FinOps capabilities |

---

## .vscode

| File | Description |
|------|-------------|
| `settings.json` | VS Code workspace settings |

---

## backend/

Node.js/Express backend for APIs, ETL, billing ingestion, and database operations.

### backend/ (root files)

| File | Description |
|------|-------------|
| `package.json` | Backend dependencies (Express, Sequelize, AWS SDK, Mongoose, JWT, etc.) |
| `package-lock.json` | Lockfile for reproducible installs |
| `.gitignore` | Ignores node_modules, .env, service account JSON files |

### backend/src/

| File | Description |
|------|-------------|
| `app.js` | Main Express application entry point |
| `worker.js` | Background worker process |
| `seed.js` | Database seeding script |
| `sample_billing.csv` | Sample billing data for testing |
| `testAutoSuggest.js` | Tests for auto-suggest mapping logic |

### backend/src/assets/

| File | Description |
|------|-------------|
| `kco_logo.png` | K&Co logo asset |

### backend/src/aws/

| File | Description |
|------|-------------|
| `assumeRole.js` | AWS STS assume-role for cross-account access |
| `ingest.js` | S3 billing ingest orchestration |
| `parseInsert.js` | Parse and insert AWS billing data |
| `readBillingFromS3.js` | Read billing data from S3 |
| `testAssume.js` | Tests for assume-role flow |

### backend/src/config/

| File | Description |
|------|-------------|
| `db.config.js` | Sequelize/PostgreSQL configuration |
| `env.config.js` | Environment variable loading and validation |
| `zoom.config.js` | Zoom meeting integration config |
| `mailgun.config.js` | Mailgun email config |
| `nodemailer.config.js` | Nodemailer config |
| `calender.config.js` | Calendar scheduling config (Google Calendar) |

### backend/src/middlewares/

| File | Description |
|------|-------------|
| `uploadFile.js` | Multer file upload middleware |
| `decodeUser.js` | JWT decode and user context middleware |
| `client.middleware.js` | Client context middleware for multi-tenancy |

### backend/src/models/

| File | Description |
|------|-------------|
| `index.js` | Sequelize model registry and associations |
| `User.js` | User model |
| `UserRole.js` | User role model |
| `Client.js` | Client/organization model |
| `cloudAccount.model.js` | Cloud account model |
| `cloudAccountCredentials.model.js` | Cloud account credentials |
| `billingUpload.model.js` | Billing upload metadata |
| `billingUsageFact.model.js` | Billing usage fact table (star schema) |
| `billingColumnMapping.model.js` | Billing column mapping |
| `billingDectectedColumn.model.js` | Detected billing columns |
| `mappingSuggestion.model.js` | Mapping suggestions |
| `rawBillingRaw.model.js` | Raw billing rows |
| `clientS3Intergration.model.js` | Client S3 integration config |
| `RawAwsBillingRow.js` | Raw AWS billing row model |
| `resource.model.js` | Resource model |
| `region.model.js` | Region model |
| `service.model.js` | Cloud service model |
| `sku.model.js` | SKU model |
| `subAccount.model.js` | Sub-account model |
| `commitmentDiscount.model.js` | Commitment discount model |
| `inquiry.model.js` | Inquiry/contact form model |

#### backend/src/models/chatbot/

| File | Description |
|------|-------------|
| `index.js` | Chatbot model exports |
| `ChatMessage.model.js` | Chat message model |
| `ChatSession.model.js` | Chat session model |
| `Client.model.js` | Chatbot client model (Mongoose) |

### backend/src/utils/

| File | Description |
|------|-------------|
| `jwt.js` | JWT helpers |
| `sendEmail.js` | Email sending utility |
| `zoomMeeting.js` | Zoom meeting creation |
| `processRecords.js` | Record processing utilities |
| `sanitize.js` | Input sanitization |
| `csvReader.js` | CSV parsing |
| `columnMapper.js` | Column mapping logic |
| `calenderSchedular.js` | Calendar scheduling |
| `emailValidation.js` | Email validation |
| `generateVerificationOTP.js` | OTP generation for verification |

#### backend/src/utils/mapping/

| File | Description |
|------|-------------|
| `normalize.js` | Mapping normalization |
| `vocab.js` | Billing vocabulary |
| `detectType.js` | Column type detection |
| `internalFields.js` | Internal field definitions |
| `canonicalMap.js` | Canonical field mapping |
| `cardinality.js` | Cardinality analysis |
| `aliases.js` | Column aliases |
| `autoSuggest.js` | Auto-suggest mapping logic |

### backend/src/common/

| File | Description |
|------|-------------|
| `constants/finops.constants.js` | FinOps constants |
| `utils/date.helpers.js` | Date helpers |
| `utils/cost.helpers.js` | Cost helpers |
| `utils/cost.calculations.js` | Cost calculation utilities |

### backend/src/modules/admin/

| File | Description |
|------|-------------|
| `admin.route.js` | Admin routes |
| `middlewares/requireAdmin.js` | Admin role check middleware |

### backend/src/modules/shared/

| File | Description |
|------|-------------|
| `client.service.js` | Shared client service |

#### backend/src/modules/shared/auth/

| File | Description |
|------|-------------|
| `auth.route.js` | Auth routes (login, signup, verify, etc.) |
| `auth.controller.js` | Auth controller |

#### backend/src/modules/shared/user/

| File | Description |
|------|-------------|
| `user.service.js` | User service |

#### backend/src/modules/shared/cloud/

| File | Description |
|------|-------------|
| `cloud.service.js` | Cloud provider integration |
| `cloud.route.js` | Cloud routes |
| `cloud.controller.js` | Cloud controller |

#### backend/src/modules/shared/inquiry/

| File | Description |
|------|-------------|
| `inquiry.route.js` | Inquiry routes |
| `inquiry.service.js` | Inquiry service |
| `inquiry.controller.js` | Inquiry controller |

#### backend/src/modules/shared/capabilities/

| File | Description |
|------|-------------|
| `capabilities.routes.js` | Capabilities API routes |
| `capabilities.map.js` | Capability mapping config |
| `capabilities.controller.js` | Capabilities controller |

#### backend/src/modules/shared/chatbot/

| File | Description |
|------|-------------|
| `chat.routes.js` | Chatbot API routes |
| `chat.controller.js` | Chat controller |
| `chat.service.js` | Chat service |
| `flow.js` | Conversation flow logic |
| `flowHelpers.js` | Flow helpers |
| `store.js` | Chat state store |
| `deepSet.js` | Deep set utility for nested objects |
| `aiExtractor.service.js` | AI extractor service for structured extraction |

#### backend/src/modules/shared/ETL/

| File | Description |
|------|-------------|
| `etl.route.js` | ETL API routes |
| `billing.controller.js` | Billing controller |
| `billingIngest.service.js` | Billing ingestion orchestration |
| `awsIngest.service.js` | AWS-specific ingestion |
| `ingestS3File.js` | S3 file ingest |
| `mapping.service.js` | Mapping service |
| `provider-detect.service.js` | Cloud provider detection |
| `pollClient.js` | Poll client for async status |
| `pollOnce.js` | Single poll utility |

##### backend/src/modules/shared/ETL/dimensions/

| File | Description |
|------|-------------|
| `index.js` | Dimension exports |
| `resolveFromMaps.js` | Resolve dimension values from maps |
| `preloadDimensionsMaps.js` | Preload dimension maps |
| `collectDimensions.js` | Collect dimension values from rows |
| `bulkUpsertDimensions.js` | Bulk dimension upsert |

##### backend/src/modules/shared/ETL/fact/

| File | Description |
|------|-------------|
| `billingUsageFact.js` | Billing usage fact processing |

### backend/src/modules/internal/

| File | Description |
|------|-------------|
| `cloud-account-credentials/cloudAccountCredential.route.js` | Internal cloud credential routes |
| `cloud-account-credentials/cloudAccountCredential.controller.js` | Internal cloud credential controller |

### backend/src/modules/core-dashboard/

| File | Description |
|------|-------------|
| `core-dashboard.routes.js` | Core dashboard route aggregation |

#### backend/src/modules/core-dashboard/analytics/

| File | Description |
|------|-------------|
| `analytics.routes.js` | Analytics route aggregation |

##### cost-analysis/

| File | Description |
|------|-------------|
| `cost-analysis.routes.js` | Cost analysis routes |
| `cost-analysis.controller.js` | Cost analysis controller |
| `cost-analysis.service.js` | Cost analysis service |
| `cost-analysis.repository.js` | Cost analysis repository |

##### cost-drivers/

| File | Description |
|------|-------------|
| `cost-drivers.routes.js` | Cost drivers routes |
| `cost-drivers.controller.js` | Cost drivers controller |
| `cost-drivers.service.js` | Cost drivers service |
| `cost-drivers.repository.js` | Cost drivers repository |

##### data-quality/

| File | Description |
|------|-------------|
| `data-quality.routes.js` | Data quality routes |
| `data-quality.controller.js` | Data quality controller |
| `data-quality.service.js` | Data quality service |
| `data-quality.repository.js` | Data quality repository |

##### resources/

| File | Description |
|------|-------------|
| `resources.routes.js` | Resources routes |
| `resources.controller.js` | Resources controller |
| `resources.service.js` | Resources service |

#### backend/src/modules/core-dashboard/reports/

| File | Description |
|------|-------------|
| `reports.routes.js` | Reports routes |
| `reports.controller.js` | Reports controller |
| `reports.service.js` | Reports service |
| `reports.pdf.js` | PDF report generation |
| `reports.aggregations.js` | Report aggregations |

#### backend/src/modules/core-dashboard/overviews/

| File | Description |
|------|-------------|
| `overview.route.js` | Overview routes |
| `overview.controller.js` | Overview controller |
| `overview.service.js` | Overview service |
| `overview.repository.js` | Overview repository |

#### backend/src/modules/core-dashboard/optimization/

| File | Description |
|------|-------------|
| `optimization.routes.js` | Optimization routes |
| `optimization.controller.js` | Optimization controller |
| `optimization.service.js` | Optimization service |
| `optimization.rules.js` | Optimization rules engine |

#### backend/src/modules/core-dashboard/governance/

| File | Description |
|------|-------------|
| `governance.routes.js` | Governance routes |
| `governance.controller.js` | Governance controller |
| `governance.service.js` | Governance service |
| `governance.policies.js` | Governance policies |

#### backend/src/modules/core-dashboard/unit-economics/

| File | Description |
|------|-------------|
| `unit-economics.routes.js` | Unit economics routes |
| `unit-economics.controller.js` | Unit economics controller |
| `unit-economics.service.js` | Unit economics service |
| `unit-economics.repository.js` | Unit economics repository |

### backend/src/modules/clients/

| File | Description |
|------|-------------|
| `index.js` | Client modules aggregation |

#### backend/src/modules/clients/client-a/

| File | Description |
|------|-------------|
| `config.js` | Client A configuration |

#### backend/src/modules/clients/client-b/

| File | Description |
|------|-------------|
| `config.js` | Client B configuration |

#### backend/src/modules/clients/client-c/

| File | Description |
|------|-------------|
| `config.js` | Client C configuration |
| `client-c.routes.js` | Client C route aggregation |
| `client-c.md` | Client C documentation |

##### Feature modules (client-c):

| Path | Description |
|------|-------------|
| `cost-alerts/` | Cost alerts routes, controller, service |
| `cost-analysis/` | Cost analysis routes, controller, service |
| `cost-drivers/` | Cost drivers routes, controller, service |
| `data-explorer/` | Data explorer routes, controller, service |
| `data-quality/` | Data quality routes, controller, service |
| `department-cost/` | Department cost routes, controller, service |
| `governance/` | Governance routes, controller, service |
| `optimization/` | Optimization routes, controller, service |
| `overview/` | Overview routes, controller, service |
| `project-tracking/` | Project tracking routes, controller, service |
| `reports/` | Reports routes, controller, service |
| `resources/` | Resources routes, controller, service |

#### backend/src/modules/clients/client-d/

| File | Description |
|------|-------------|
| `config.js` | Client D configuration |
| `client-d.routes.js` | Client D route aggregation |
| `helpers/extractUploadId.js` | Extract upload ID helper |
| `docs/client-d.md` | Client D documentation |
| `docs/*.png` | Screenshots for cost-analysis, data-drivers, data-quality, governance, optimization, overview, reports, resources, unit-economics |

##### Feature modules (client-d):

| Path | Description |
|------|-------------|
| `analytics/` | cost-analysis, cost-drivers, data-quality, resources |
| `governance/` | Governance routes, controller, service |
| `optimization/` | Optimization routes, controller, service |
| `overviews/` | Overviews routes, controller, service |
| `reports/` | Reports routes, controller, service |
| `unit-economics/` | Unit economics routes, controller, service |

---

## frontend/

React 19 + TypeScript + Vite 7 frontend (kco-finops-ui).

### frontend/ (root files)

| File | Description |
|------|-------------|
| `package.json` | React 19, Vite 7, Recharts, Zustand, Tailwind, etc. |
| `package-lock.json` | Lockfile |
| `index.html` | HTML entry point |
| `vite.config.ts` | Vite configuration |
| `tsconfig.json` | TypeScript config |
| `tsconfig.node.json` | TypeScript config for Node (Vite tooling) |
| `tailwind.config.js` | Tailwind CSS config |
| `postcss.config.js` | PostCSS config |
| `eslint.config.js` | ESLint config |
| `vercel.json` | Vercel SPA rewrites for deployment |

### frontend/public/

| File | Description |
|------|-------------|
| `aws.svg` | AWS logo |
| `azure.svg` | Azure logo |
| `gcp.svg` | GCP logo |
| `oracle.svg` | Oracle logo |
| `hero-icon.svg` | Hero section icon |
| `k&cologo.svg` | K&Co logo |
| `k&coicon.svg` | K&Co icon |

### frontend/src/

| File | Description |
|------|-------------|
| `main.tsx` | React entry point |
| `App.tsx` | Root app component |
| `App.css` | App-level styles |
| `index.css` | Global styles |
| `vite-env.d.ts` | Vite env type declarations |
| `Demo.tsx` | Demo component |
| `Demo1.tsx` | Demo component |

### frontend/src/hooks/

| File | Description |
|------|-------------|
| `useDebounce.ts` | Debounce hook |
| `useCaps.ts` | Capabilities hook |
| `useApiCall.ts` | API call hook |

### frontend/src/store/

| File | Description |
|------|-------------|
| `Dashboard.store.tsx` | Dashboard Zustand store |
| `Authstore.tsx` | Auth Zustand store |

### frontend/src/services/

| File | Description |
|------|-------------|
| `http.ts` | HTTP client |
| `apiClient.ts` | API client wrapper |
| `capabilities.api.ts` | Capabilities API |
| `getCapabilities.ts` | Capability fetcher |

### frontend/src/utils/

| File | Description |
|------|-------------|
| `columnMapper.ts` | Column mapping utilities |

### frontend/src/shared/

| File | Description |
|------|-------------|
| `index.ts` | Shared exports |

#### frontend/src/shared/auth/

| File | Description |
|------|-------------|
| `index.ts` | Auth exports |
| `components/LoginForm.tsx` | Login form |
| `components/SignupForm.tsx` | Signup form |
| `components/ForgotPassword.tsx` | Forgot password |
| `components/ResetPassword.tsx` | Reset password |
| `components/VerifyForm.tsx` | Email verification form |
| `components/AuthModal.tsx` | Auth modal |
| `components/index.ts` | Auth component exports |

#### frontend/src/shared/home/

| File | Description |
|------|-------------|
| `index.ts` | Home exports |
| `Hero.tsx` | Hero section |
| `Navbar.tsx` | Navbar |
| `Footer.tsx` | Footer |
| `About.tsx` | About section |
| `Features.tsx` | Features section |
| `HowItWorks.tsx` | How it works |
| `FinOpsSection.tsx` | FinOps section |
| `Pricing.tsx` | Pricing |
| `InquirySection.tsx` | Inquiry section |
| `PrivacyPolicy.tsx` | Privacy policy |
| `TermsOfService.tsx` | Terms of service |
| `SlotBookingPage.tsx` | Slot booking page |

#### frontend/src/shared/csv-upload/

| File | Description |
|------|-------------|
| `CSVUpload.tsx` | CSV upload component |
| `CSVUploadInput.tsx` | CSV upload input |
| `BillingUpload.tsx` | Billing upload UI |
| `CloudFileManagerPanel.tsx` | Cloud file manager panel |
| `theme.ts` | Upload theme |

#### frontend/src/shared/chatbot/

| File | Description |
|------|-------------|
| `Chatbot.tsx` | Chatbot UI component |

### frontend/src/core-dashboard/

Core dashboard feature set.

| File | Description |
|------|-------------|
| `verticalSidebar.config.ts` | Sidebar navigation config |
| `CORE_DASHBOARD_QA_CHECKLIST.md` | QA checklist |
| `utils/index.ts` | Utils exports |
| `utils/columnMapper.ts` | Column mapper for core dashboard |

#### frontend/src/core-dashboard/common/

| File | Description |
|------|-------------|
| `index.ts` | Common exports |
| `SectionStates.tsx` | Section loading/error states |
| `PremiumGate.tsx` | Premium feature gate |
| `Layout/Header.tsx` | Header layout |
| `Layout/VerticalSidebar.tsx` | Vertical sidebar |
| `Layout/index.ts` | Layout exports |
| `widgets/KpiGrid.tsx` | KPI grid widget |
| `widgets/FilterBar.tsx` | Filter bar |
| `widgets/FilterBarCost.tsx` | Cost filter bar |
| `widgets/CostTrendChart.tsx` | Cost trend chart |
| `widgets/CostPredictability.tsx` | Cost predictability widget |
| `widgets/CostRisk.tsx` | Cost risk widget |
| `widgets/MetricCards.tsx` | Metric cards |
| `widgets/MostPopularRegion.tsx` | Most popular region widget |
| `widgets/RegionPieChart.tsx` | Region pie chart |
| `widgets/ServiceSpendChart.tsx` | Service spend chart |
| `widgets/index.ts` | Widget exports |

#### frontend/src/core-dashboard/dashboard/

| File | Description |
|------|-------------|
| `DashboardPage.tsx` | Main dashboard page |
| `lazyViews.tsx` | Lazy-loaded views |
| `index.ts` | Dashboard exports |
| `components/Loaders.tsx` | Loaders |
| `components/KeepAlive.tsx` | KeepAlive wrapper |
| `components/ModuleErrorBoundary.tsx` | Module error boundary |
| `hooks/useDashboardRoutes.tsx` | Dashboard routing hook |
| `hooks/useHeaderAnomalies.tsx` | Header anomalies hook |
| `hooks/useKeepAliveRegistry.tsx` | KeepAlive registry hook |
| `hooks/useDashboardCapabilities.tsx` | Dashboard capabilities hook |

#### frontend/src/core-dashboard/feature modules/

| Module | Description |
|--------|-------------|
| `accounts-ownership/` | Accounts ownership views, hooks, components |
| `cost-analysis/` | Cost analysis views, hooks, components |
| `cost-drivers/` | Cost drivers views, hooks, components |
| `data-explorer/` | Data explorer views, hooks, components |
| `data-quality/` | Data quality views, hooks, components |
| `optimization/` | Optimization views, tabs, components |
| `overview/` | Overview views, hooks, components |
| `reports/` | Reports views, hooks, components |
| `resources/` | Resource inventory views, hooks, components |

### frontend/src/clients/

Client-specific dashboard variants.

#### frontend/src/clients/client-1/

| File | Description |
|------|-------------|
| `theme.ts` | Client 1 theme |
| `overrides/Dashboard.tsx` | Dashboard override |
| `config.ts` | Client 1 config |

#### frontend/src/clients/client-2/

| File | Description |
|------|-------------|
| `theme.ts` | Client 2 theme |
| `overrides/Dashboard.tsx` | Dashboard override |

#### frontend/src/clients/client-c/

| File | Description |
|------|-------------|
| `index.ts` | Client C exports |
| `client-c.tsx` | Client C root component |
| `verticalSidebar.config.ts` | Client C sidebar config |
| `common/` | Layout, widgets for Client C |
| `dashboard/` | Dashboard page, routing, layout, hooks |
| Feature modules: `accounts-ownership`, `cost-alerts`, `cost-analysis`, `cost-drivers`, `department-cost`, `data-explorer`, `data-quality`, `optimization`, `overview`, `project-tracking`, `reports`, `resources` |

#### frontend/src/clients/client-d/

| File | Description |
|------|-------------|
| `verticalSidebar.config.ts` | Client D sidebar config |
| `utils/utils.tsx` | Client D utilities |
| `dashboard/client-d.dashboard.page.tsx` | Client D dashboard page |
| Feature modules: `accounts-ownership`, `cost-analysis`, `cost-drivers`, `data-explorer`, `data-quality`, `optimization`, `overview`, `reports`, `resources`, `unit-economics` |

### frontend/src/assets/

| File | Description |
|------|-------------|
| `react.svg` | React logo |

---

## Summary

| Category | Approx. Count |
|----------|---------------|
| Backend JS source files | ~130 |
| Frontend TS/TSX source files | ~180 |
| Config files | ~25 |
| Documentation | ~10 |
| Public/asset files | ~10 |

**Excluded:** `node_modules`, `.git`, `dist`, `build`, `uploads`, `logs`, `.env*`
