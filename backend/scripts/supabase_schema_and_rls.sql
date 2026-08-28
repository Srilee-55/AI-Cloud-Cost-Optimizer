-- ==============================================================================
-- AI Cloud Cost Optimizer — Supabase PostgreSQL Schema & Row Level Security (RLS)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Member' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_superuser BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);

-- 2. Workspaces Table
CREATE TABLE IF NOT EXISTS workspaces (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    account_type VARCHAR(50) DEFAULT 'Growing Business' NOT NULL,
    monthly_budget DOUBLE PRECISION DEFAULT 10000.0 NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD' NOT NULL,
    is_demo BOOLEAN DEFAULT FALSE NOT NULL,
    onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL,
    checklist_json TEXT DEFAULT '{}' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_workspaces_slug ON workspaces(slug);

-- 3. Workspace Members Table
CREATE TABLE IF NOT EXISTS workspace_members (
    id VARCHAR(36) PRIMARY KEY,
    workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(50) DEFAULT 'Member' NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_workspace_user UNIQUE (workspace_id, user_id)
);
CREATE INDEX IF NOT EXISTS ix_wm_workspace_id ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS ix_wm_user_id ON workspace_members(user_id);

-- 4. Cloud Providers Table
CREATE TABLE IF NOT EXISTS cloud_providers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    icon VARCHAR(100) DEFAULT 'Cloud',
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_cloud_providers_code ON cloud_providers(code);

-- 5. Cloud Accounts Table
CREATE TABLE IF NOT EXISTS cloud_accounts (
    id VARCHAR(36) PRIMARY KEY,
    workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    provider_id VARCHAR(36) REFERENCES cloud_providers(id) ON DELETE RESTRICT NOT NULL,
    account_id VARCHAR(100) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    environment VARCHAR(50) DEFAULT 'Production' NOT NULL,
    credentials_json TEXT DEFAULT '{}' NOT NULL,
    status VARCHAR(50) DEFAULT 'Connected' NOT NULL,
    is_demo BOOLEAN DEFAULT FALSE NOT NULL,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_cloud_accounts_ws ON cloud_accounts(workspace_id);

-- 6. Cloud Resources Table
CREATE TABLE IF NOT EXISTS cloud_resources (
    id VARCHAR(36) PRIMARY KEY,
    workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    cloud_account_id VARCHAR(36) REFERENCES cloud_accounts(id) ON DELETE CASCADE NOT NULL,
    resource_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    region VARCHAR(50) DEFAULT 'us-east-1' NOT NULL,
    status VARCHAR(50) DEFAULT 'running' NOT NULL,
    cpu_utilization DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    memory_utilization DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    cost_monthly DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    cost_center VARCHAR(100) DEFAULT 'Engineering' NOT NULL,
    team VARCHAR(100) DEFAULT 'Platform' NOT NULL,
    project VARCHAR(100) DEFAULT 'Core Services' NOT NULL,
    tags_json TEXT DEFAULT '{}' NOT NULL,
    is_demo BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_cloud_resources_ws ON cloud_resources(workspace_id);
CREATE INDEX IF NOT EXISTS ix_cloud_resources_res_id ON cloud_resources(resource_id);

-- 7. Cost Records Table
CREATE TABLE IF NOT EXISTS cost_records (
    id VARCHAR(36) PRIMARY KEY,
    workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    cloud_account_id VARCHAR(36) REFERENCES cloud_accounts(id) ON DELETE SET NULL,
    cloud_resource_id VARCHAR(36) REFERENCES cloud_resources(id) ON DELETE SET NULL,
    provider_code VARCHAR(50) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255) DEFAULT 'unknown' NOT NULL,
    region VARCHAR(50) DEFAULT 'us-east-1' NOT NULL,
    cost_date DATE NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD' NOT NULL,
    cost_center VARCHAR(100) DEFAULT 'Engineering' NOT NULL,
    team VARCHAR(100) DEFAULT 'Platform' NOT NULL,
    project VARCHAR(100) DEFAULT 'Core Services' NOT NULL,
    environment VARCHAR(50) DEFAULT 'Production' NOT NULL,
    tags_json TEXT DEFAULT '{}' NOT NULL,
    is_demo BOOLEAN DEFAULT FALSE NOT NULL,
    source VARCHAR(50) DEFAULT 'automated_sync' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_cost_records_ws_date ON cost_records(workspace_id, cost_date);
CREATE INDEX IF NOT EXISTS ix_cost_records_service ON cost_records(service_name);
CREATE INDEX IF NOT EXISTS ix_cost_records_provider ON cost_records(provider_code);

-- 8. Cost Efficiency Scores Table
CREATE TABLE IF NOT EXISTS cost_efficiency_scores (
    id VARCHAR(36) PRIMARY KEY,
    workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    score_date DATE NOT NULL,
    efficiency_score DOUBLE PRECISION NOT NULL,
    waste_percentage DOUBLE PRECISION NOT NULL,
    idle_spend_ratio DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_ces_ws_date ON cost_efficiency_scores(workspace_id, score_date);

-- 9. Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
    id VARCHAR(36) PRIMARY KEY,
    workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    period VARCHAR(50) DEFAULT 'monthly' NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD' NOT NULL,
    alert_threshold_percent DOUBLE PRECISION DEFAULT 80.0 NOT NULL,
    current_spend DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    status VARCHAR(50) DEFAULT 'healthy' NOT NULL,
    cost_center VARCHAR(100) DEFAULT 'All' NOT NULL,
    team VARCHAR(100) DEFAULT 'All' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_budgets_ws ON budgets(workspace_id);

-- 10. Anomalies Table
CREATE TABLE IF NOT EXISTS anomalies (
    id VARCHAR(36) PRIMARY KEY,
    workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    provider_code VARCHAR(50) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255) NOT NULL,
    anomaly_date DATE NOT NULL,
    expected_cost DOUBLE PRECISION NOT NULL,
    actual_cost DOUBLE PRECISION NOT NULL,
    difference DOUBLE PRECISION NOT NULL,
    deviation_percent DOUBLE PRECISION NOT NULL,
    severity VARCHAR(50) DEFAULT 'Warning' NOT NULL,
    possible_cause TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_anomalies_ws_date ON anomalies(workspace_id, anomaly_date);

-- 11. Forecasts Table
CREATE TABLE IF NOT EXISTS forecasts (
    id VARCHAR(36) PRIMARY KEY,
    workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    forecast_type VARCHAR(50) DEFAULT 'daily' NOT NULL,
    target_date DATE NOT NULL,
    predicted_cost DOUBLE PRECISION NOT NULL,
    lower_bound DOUBLE PRECISION NOT NULL,
    upper_bound DOUBLE PRECISION NOT NULL,
    confidence_score DOUBLE PRECISION NOT NULL,
    method VARCHAR(50) DEFAULT 'linear_regression' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_forecasts_ws_target ON forecasts(workspace_id, target_date);

-- 12. Savings Estimates Table
CREATE TABLE IF NOT EXISTS savings_estimates (
    id VARCHAR(36) PRIMARY KEY,
    workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    provider_code VARCHAR(50) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    current_monthly_spend DOUBLE PRECISION NOT NULL,
    estimated_monthly_spend DOUBLE PRECISION NOT NULL,
    estimated_monthly_savings DOUBLE PRECISION NOT NULL,
    savings_percent DOUBLE PRECISION NOT NULL,
    confidence_score DOUBLE PRECISION NOT NULL,
    risk_level VARCHAR(50) DEFAULT 'Low' NOT NULL,
    status VARCHAR(50) DEFAULT 'identified' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_savings_ws ON savings_estimates(workspace_id);

-- 13. Agent Sessions Table
CREATE TABLE IF NOT EXISTS agent_sessions (
    id VARCHAR(36) PRIMARY KEY,
    workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    goal TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'running' NOT NULL,
    summary TEXT DEFAULT '' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_agent_sessions_ws ON agent_sessions(workspace_id);

-- 14. Agent Actions Table
CREATE TABLE IF NOT EXISTS agent_actions (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) REFERENCES agent_sessions(id) ON DELETE CASCADE NOT NULL,
    step_number INTEGER NOT NULL,
    tool_name VARCHAR(100) NOT NULL,
    purpose TEXT NOT NULL,
    tool_input_json TEXT DEFAULT '{}' NOT NULL,
    tool_output_json TEXT DEFAULT '{}' NOT NULL,
    duration_ms DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    status VARCHAR(50) DEFAULT 'success' NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_agent_actions_session ON agent_actions(session_id);

-- 15. Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) REFERENCES agent_sessions(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    metadata_json TEXT DEFAULT '{}' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_chat_messages_session ON chat_messages(session_id);

-- 16. AI Recommendations Table
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id VARCHAR(36) PRIMARY KEY,
    workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    session_id VARCHAR(36),
    title VARCHAR(255) NOT NULL,
    problem TEXT NOT NULL,
    evidence_json TEXT DEFAULT '{}' NOT NULL,
    possible_cause TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    current_cost DOUBLE PRECISION NOT NULL,
    optimized_estimated_cost DOUBLE PRECISION NOT NULL,
    estimated_savings DOUBLE PRECISION NOT NULL,
    savings_percentage DOUBLE PRECISION NOT NULL,
    priority VARCHAR(50) DEFAULT 'Medium' NOT NULL,
    confidence DOUBLE PRECISION DEFAULT 0.90 NOT NULL,
    risk_level VARCHAR(50) DEFAULT 'Low' NOT NULL,
    provider VARCHAR(50) NOT NULL,
    service VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255) NOT NULL,
    approval_status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    simulated_at TIMESTAMPTZ,
    simulated_result_json TEXT,
    tool_trace_json TEXT DEFAULT '[]' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_ai_recs_ws ON ai_recommendations(workspace_id);
CREATE INDEX IF NOT EXISTS ix_ai_recs_status ON ai_recommendations(approval_status);

-- 17. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(36) PRIMARY KEY,
    workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    alert_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(50) DEFAULT 'Warning' NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    metadata_json TEXT DEFAULT '{}' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_alerts_ws_read ON alerts(workspace_id, is_read);

-- 18. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255) DEFAULT '/dashboard' NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_notifs_user_read ON notifications(user_id, is_read);

-- 19. Webhook Events Table
CREATE TABLE IF NOT EXISTS webhook_events (
    id VARCHAR(36) PRIMARY KEY,
    workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload_json TEXT NOT NULL,
    target_url VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'delivered' NOT NULL,
    response_code VARCHAR(50) DEFAULT '200' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_webhooks_ws ON webhook_events(workspace_id);

-- 20. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255) DEFAULT 'system@cloudoptimizer.ai' NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255) NOT NULL,
    details_json TEXT DEFAULT '{}' NOT NULL,
    ip_address VARCHAR(50) DEFAULT '127.0.0.1' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_audit_ws_date ON audit_logs(workspace_id, created_at);

-- 21. Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(36) PRIMARY KEY,
    workspace_id VARCHAR(36) REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    file_format VARCHAR(10) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'completed' NOT NULL,
    metadata_json TEXT DEFAULT '{}' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_reports_ws ON reports(workspace_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable Row Level Security on all user data tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_efficiency_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 1. Service Role Bypass Policy (Allows backend FastAPI service role full access)
CREATE POLICY "service_role_all_users" ON users FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);
CREATE POLICY "service_role_all_workspaces" ON workspaces FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);
CREATE POLICY "service_role_all_wm" ON workspace_members FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);
CREATE POLICY "service_role_all_accounts" ON cloud_accounts FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);
CREATE POLICY "service_role_all_resources" ON cloud_resources FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);
CREATE POLICY "service_role_all_costs" ON cost_records FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);
CREATE POLICY "service_role_all_ces" ON cost_efficiency_scores FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);
CREATE POLICY "service_role_all_budgets" ON budgets FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);
CREATE POLICY "service_role_all_anomalies" ON anomalies FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);
CREATE POLICY "service_role_all_forecasts" ON forecasts FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);
CREATE POLICY "service_role_all_savings" ON savings_estimates FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);
CREATE POLICY "service_role_all_agent_sessions" ON agent_sessions FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);
CREATE POLICY "service_role_all_agent_actions" ON agent_actions FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);
CREATE POLICY "service_role_all_chat_messages" ON chat_messages FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);
CREATE POLICY "service_role_all_recommendations" ON ai_recommendations FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);
CREATE POLICY "service_role_all_alerts" ON alerts FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);
CREATE POLICY "service_role_all_notifications" ON notifications FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);
CREATE POLICY "service_role_all_webhooks" ON webhook_events FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);
CREATE POLICY "service_role_all_audit" ON audit_logs FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);
CREATE POLICY "service_role_all_reports" ON reports FOR ALL USING (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);
