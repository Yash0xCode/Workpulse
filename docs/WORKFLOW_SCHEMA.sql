CREATE TABLE IF NOT EXISTS workflow_definitions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(120) NOT NULL UNIQUE,
  resource_type VARCHAR(80) NOT NULL,
  initial_state VARCHAR(80) NOT NULL,
  states JSONB NOT NULL DEFAULT '[]'::jsonb,
  transitions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workflow_instances (
  id SERIAL PRIMARY KEY,
  definition_id INTEGER NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  resource_type VARCHAR(80) NOT NULL,
  resource_id INTEGER NOT NULL,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requester_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  current_state VARCHAR(80) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_instances_unique_resource
  ON workflow_instances(resource_type, resource_id, organization_id);

CREATE INDEX IF NOT EXISTS idx_workflow_instances_org_status
  ON workflow_instances(organization_id, status);

CREATE TABLE IF NOT EXISTS workflow_actions (
  id SERIAL PRIMARY KEY,
  instance_id INTEGER NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  step_no INTEGER NOT NULL,
  actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(80) NOT NULL,
  from_state VARCHAR(80),
  to_state VARCHAR(80),
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflow_actions_instance
  ON workflow_actions(instance_id, step_no);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  resource_type VARCHAR(80),
  resource_id INTEGER,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON notifications(user_id, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS notification_webhooks (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type VARCHAR(80) NOT NULL,
  target_url TEXT NOT NULL,
  secret TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (organization_id, event_type, target_url)
);

CREATE INDEX IF NOT EXISTS idx_notification_webhooks_org_event
  ON notification_webhooks(organization_id, event_type, is_active);

CREATE TABLE IF NOT EXISTS notification_webhook_deliveries (
  id SERIAL PRIMARY KEY,
  webhook_id INTEGER REFERENCES notification_webhooks(id) ON DELETE SET NULL,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type VARCHAR(80) NOT NULL,
  resource_type VARCHAR(80),
  resource_id INTEGER,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  http_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempt_no INTEGER NOT NULL DEFAULT 1,
  delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_webhook_deliveries_org
  ON notification_webhook_deliveries(organization_id, delivered_at DESC);
