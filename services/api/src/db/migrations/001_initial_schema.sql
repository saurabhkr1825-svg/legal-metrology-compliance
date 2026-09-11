-- Migration: 001_initial_schema
-- Created: 2026-09-11
-- Description: Initial database schema for users, inspections, and audit logs

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('FIELD_OFFICER', 'SUPERVISOR', 'ADMIN')),
  phone VARCHAR(50),
  region VARCHAR(255),
  department VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_active ON users(role, is_active);

-- Inspections table
CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_uuid UUID NOT NULL UNIQUE,
  officer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL CHECK (status IN ('DRAFT', 'PENDING_UPLOAD', 'QUEUED', 'PROCESSING', 'REVIEW_REQUIRED', 'COMPLETED', 'SYNCED')),
  result VARCHAR(50) CHECK (result IN ('PASS', 'FAIL', 'REVIEW')),

  -- Evidence
  image_url TEXT,
  image_metadata JSONB,

  -- Extracted data
  raw_ocr_data JSONB,
  declaration JSONB,
  reviewed_declaration JSONB,

  -- Evaluation
  violations JSONB DEFAULT '[]'::jsonb,
  rule_version VARCHAR(50),

  -- Timestamps
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  location JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_inspections_client_uuid ON inspections(client_uuid);
CREATE INDEX idx_inspections_officer_id ON inspections(officer_id);
CREATE INDEX idx_inspections_status ON inspections(status);
CREATE INDEX idx_inspections_officer_status ON inspections(officer_id, status);
CREATE INDEX idx_inspections_created_at ON inspections(created_at DESC);

-- Products table (optional reference data)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barcode VARCHAR(255),
  commodity_name VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255),
  category VARCHAR(255),
  last_inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL,
  violation_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_commodity_name ON products(commodity_name);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  changes JSONB,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  pdf_url TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  generated_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_reports_inspection_id ON reports(inspection_id);

-- Rules table (versioned compliance rules)
CREATE TABLE rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id VARCHAR(50) NOT NULL,
  version VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(50) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  conditions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(rule_id, version)
);

CREATE INDEX idx_rules_rule_id_version ON rules(rule_id, version);
CREATE INDEX idx_rules_enabled ON rules(enabled);
CREATE INDEX idx_rules_category ON rules(category);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON inspections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rules_updated_at BEFORE UPDATE ON rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
