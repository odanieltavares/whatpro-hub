-- ============================================================================
-- WhatPro Hub - Database Initialization Script
-- ============================================================================
-- Run this script in PostgreSQL to initialize the database manually
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector extension (for AI features)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- Accounts Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    chatwoot_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    locale VARCHAR(10) DEFAULT 'pt_BR',
    domain VARCHAR(255),
    support_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    features JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Users Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    chatwoot_id INTEGER UNIQUE NOT NULL,
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    chatwoot_role VARCHAR(50) DEFAULT 'agent',
    whatpro_role VARCHAR(50) DEFAULT 'agent',
    custom_role_id INTEGER,
    availability_status VARCHAR(50) DEFAULT 'online',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Teams Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    chatwoot_id INTEGER UNIQUE NOT NULL,
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    allow_auto_assign BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Team Members Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, user_id)
);

-- ============================================================================
-- Providers Table (WhatsApp APIs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- evolution, uazapi, baileys, cloud_api
    base_url VARCHAR(500) NOT NULL,
    api_key_encrypted TEXT NOT NULL,
    instance_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'disconnected',
    health_check_url VARCHAR(500),
    last_health_check TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Boards Table (Kanban)
-- ============================================================================
CREATE TABLE IF NOT EXISTS boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'pipeline', -- pipeline, support, custom
    is_default BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Stages Table (Kanban Columns)
-- ============================================================================
CREATE TABLE IF NOT EXISTS stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#4ECDC4',
    position INTEGER NOT NULL,
    sla_hours INTEGER,
    auto_actions JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Cards Table (Kanban Cards / Conversations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stage_id UUID NOT NULL REFERENCES stages(id),
    chatwoot_conversation_id INTEGER NOT NULL,
    chatwoot_contact_id INTEGER,
    title VARCHAR(255),
    contact_name VARCHAR(255),
    contact_avatar_url VARCHAR(500),
    last_message TEXT,
    last_message_at TIMESTAMP,
    value DECIMAL(15, 2),
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    due_date TIMESTAMP,
    assignee_id INTEGER,
    labels TEXT[],
    custom_attributes JSONB DEFAULT '{}',
    position INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Card History Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS card_histories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    user_id INTEGER,
    action VARCHAR(50) NOT NULL, -- created, moved, updated, archived
    from_stage_id UUID,
    to_stage_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Sessions Table (JWT Sessions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Audit Logs Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER,
    account_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Accounts
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_account_role ON users(account_id, whatpro_role);
CREATE INDEX IF NOT EXISTS idx_users_availability ON users(availability_status);

-- Teams
CREATE INDEX IF NOT EXISTS idx_teams_account ON teams(account_id);

-- Team Members
CREATE INDEX IF NOT EXISTS idx_team_members_team_user ON team_members(team_id, user_id);

-- Providers
CREATE INDEX IF NOT EXISTS idx_providers_account_status ON providers(account_id, status);
CREATE INDEX IF NOT EXISTS idx_providers_type ON providers(type);

-- Boards
CREATE INDEX IF NOT EXISTS idx_boards_account_default ON boards(account_id, is_default);

-- Stages
CREATE INDEX IF NOT EXISTS idx_stages_board_position ON stages(board_id, position);

-- Cards
CREATE INDEX IF NOT EXISTS idx_cards_stage ON cards(stage_id);
CREATE INDEX IF NOT EXISTS idx_cards_conversation ON cards(chatwoot_conversation_id);
CREATE INDEX IF NOT EXISTS idx_cards_assignee ON cards(assignee_id);
CREATE INDEX IF NOT EXISTS idx_cards_priority ON cards(priority);
CREATE INDEX IF NOT EXISTS idx_cards_stage_position ON cards(stage_id, position);

-- Card History
CREATE INDEX IF NOT EXISTS idx_card_history_card ON card_histories(card_id);
CREATE INDEX IF NOT EXISTS idx_card_history_created ON card_histories(created_at DESC);

-- Sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_account ON audit_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================================
-- Initial Data (Optional)
-- ============================================================================

-- You can add seed data here if needed
-- Example:
-- INSERT INTO accounts (chatwoot_id, name) VALUES (1, 'Demo Account');
