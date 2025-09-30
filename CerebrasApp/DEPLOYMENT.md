# Deployment Guide: Bank Statement Analyzer

## Prerequisites
- Docker and Docker Compose
- SSL certificates
- API keys:
  - OpenRouter API key
  - Cerebras API key
  - Stripe API keys
  - Supabase credentials

## Environment Setup

1. Create `.env` file in root directory:
```env
# Application
NODE_ENV=production
APP_ENV=production
DEBUG=false

# API Keys
OPENROUTER_API_KEY=your_openrouter_key
CEREBRAS_API_KEY=your_cerebras_key
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Security
SECRET_KEY=your_app_secret_key
ENCRYPTION_KEY=your_encryption_key

# Redis
REDIS_URL=redis://redis:6379/0
```

2. Place SSL certificates:
```bash
mkdir -p nginx/certs
# Copy your SSL certificates
cp your_cert.crt nginx/certs/server.crt
cp your_key.key nginx/certs/server.key
```

## Production Deployment

1. Build and start services:
```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

2. Run database migrations:
```bash
# Connect to the API container
docker-compose exec api bash

# Run migrations
python manage.py migrate
```

3. Verify deployment:
```bash
# Check service status
docker-compose ps

# Check logs
docker-compose logs -f
```

## Configuration Checklist

### Frontend Configuration
- [ ] Set production API endpoint
- [ ] Enable production error tracking
- [ ] Configure analytics
- [ ] Set up CDN (optional)

### Backend Configuration
- [ ] Configure logging
- [ ] Set up error monitoring
- [ ] Configure backup strategy
- [ ] Set rate limits

### Security Configuration
- [ ] SSL certificates installed
- [ ] Firewall rules configured
- [ ] Rate limiting enabled
- [ ] CORS settings verified

### Monitoring Setup
- [ ] Container health checks
- [ ] Resource monitoring
- [ ] Error alerting
- [ ] Performance monitoring

## Scaling Configuration

### Horizontal Scaling
```yaml
services:
  api:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
```

### Cache Configuration
```yaml
services:
  redis:
    deploy:
      resources:
        limits:
          memory: 2G
```

## Backup and Recovery

1. Database Backups:
```bash
# Automated daily backups
0 0 * * * docker-compose exec -T redis redis-cli SAVE

# Manual backup
docker-compose exec redis redis-cli SAVE
```

2. Volume Backups:
```bash
# Backup volumes
docker run --rm -v cerebrasapp_redis_data:/data -v /backup:/backup alpine tar czf /backup/redis-data.tar.gz /data
```

## Troubleshooting

### Common Issues

1. Container Health:
```bash
# Check container health
docker-compose ps
docker-compose logs [service_name]
```

2. Performance Issues:
```bash
# Monitor resources
docker stats
```

3. Connection Issues:
```bash
# Test internal networking
docker-compose exec api ping redis
```

### Recovery Procedures

1. Service Recovery:
```bash
# Restart specific service
docker-compose restart [service_name]

# Full restart
docker-compose down
docker-compose up -d
```

2. Data Recovery:
```bash
# Restore Redis backup
docker-compose down
docker run --rm -v cerebrasapp_redis_data:/data -v /backup:/backup alpine sh -c "cd /data && tar xzf /backup/redis-data.tar.gz --strip 1"
docker-compose up -d
```

## Monitoring

### Health Checks

1. API Health:
```bash
curl https://your-domain.com/api/health
```

2. Redis Health:
```bash
docker-compose exec redis redis-cli ping
```

### Performance Monitoring

1. Container Metrics:
```bash
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
```

2. Application Logs:
```bash
# View real-time logs
docker-compose logs -f --tail=100
```

## Security Measures

1. Network Security:
- Restricted container communication
- TLS 1.3 enforcement
- Rate limiting
- IP whitelisting (optional)

2. Data Security:
- Encryption at rest
- Secure key management
- Regular security updates
- GDPR compliance

## Maintenance

### Regular Updates

1. Update Images:
```bash
# Pull latest images
docker-compose pull

# Rebuild and restart
docker-compose up -d --build
```

2. Security Updates:
```bash
# Update base images
docker-compose build --pull

# Apply updates
docker-compose up -d
```

### Cleanup

1. Remove unused resources:
```bash
# Clean up unused images
docker image prune -a

# Clean up unused volumes
docker volume prune
```

## Support and Contact

For support issues:
- Technical Support: support@your-domain.com
- Security Issues: security@your-domain.com
- Emergency Contact: +1 (XXX) XXX-XXXX