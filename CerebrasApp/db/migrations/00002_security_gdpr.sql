# Create migration for access_logs table for GDPR compliance
CREATE TABLE access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    data_type TEXT NOT NULL,
    action TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    details JSONB
);

# Add GDPR-related columns to users table
ALTER TABLE users
ADD COLUMN gdpr_consent BOOLEAN DEFAULT false,
ADD COLUMN gdpr_consent_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN data_retention_preference TEXT DEFAULT 'standard',
ADD COLUMN marketing_consent BOOLEAN DEFAULT false;

# Create table for data deletion requests
CREATE TABLE data_deletion_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending',
    completed_date TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

# Add encrypted columns for sensitive data
ALTER TABLE bank_statements
ADD COLUMN encrypted_metadata TEXT;

# Add indexes for performance
CREATE INDEX idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX idx_access_logs_timestamp ON access_logs(timestamp);
CREATE INDEX idx_data_deletion_requests_status ON data_deletion_requests(status);

# Add trigger for data retention
CREATE OR REPLACE FUNCTION delete_old_data()
RETURNS trigger AS $$
BEGIN
    -- Delete data older than retention period
    DELETE FROM access_logs
    WHERE timestamp < NOW() - INTERVAL '30 days';
    
    -- Delete processed statements older than retention period
    DELETE FROM bank_statements
    WHERE processed_date < NOW() - INTERVAL '30 days'
    AND status = 'completed';
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_old_data
    AFTER INSERT ON access_logs
    EXECUTE FUNCTION delete_old_data();