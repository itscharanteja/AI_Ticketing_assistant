# 🚀 CI/CD Pipeline Documentation

## Overview

This project implements a comprehensive CI/CD pipeline using GitHub Actions that automates testing, building, security scanning, and deployment processes.

## 📋 Pipeline Components

### 1. Main CI Pipeline (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**
- **Test & Lint**: Runs tests and linting for all services
- **Build**: Builds Docker images for all services
- **Integration**: Runs integration tests with Docker Compose
- **Security**: Performs vulnerability scanning with Trivy
- **Deploy Staging**: Deploys to staging environment (main branch only)
- **Performance**: Runs basic performance tests

### 2. Dependency Update (`.github/workflows/dependency-update.yml`)

**Triggers:**
- Scheduled (every Monday at 9 AM UTC)
- Manual trigger

**Features:**
- Checks for outdated dependencies
- Creates automated pull requests for updates
- Runs weekly to keep dependencies current

### 3. Release Management (`.github/workflows/release.yml`)

**Triggers:**
- Push of version tags (e.g., `v1.0.0`)

**Features:**
- Runs full test suite
- Builds Docker images
- Creates GitHub releases
- Generates release notes

## 🛠️ Setup Instructions

### 1. GitHub Secrets Configuration

Add the following secrets to your GitHub repository:

```bash
# Required for AI service
PERPLEXITY_API_KEY=your_perplexity_api_key

# Optional for notifications
SLACK_WEBHOOK_URL=your_slack_webhook_url
EMAIL_NOTIFICATION=your_email@example.com
```

### 2. Environment Variables

The pipeline uses these environment variables:

```bash
# Database
DB_HOST=localhost
DB_USER=postgres
DB_PASS=password
DB_NAME=ticketdb_test
DB_PORT=5432

# AI Service
PERPLEXITY_API_KEY=your_key_here

# Email Service
SMTP_HOST=smtp.test.com
SMTP_PORT=587
SMTP_USER=test@example.com
SMTP_PASS=testpassword
```

### 3. Local Development Setup

```bash
# Install dependencies
cd ticket-service && npm install
cd ../ai-service && npm install
cd ../frontend && npm install

# Run linting
npm run lint

# Run tests
npm test

# Fix linting issues
npm run lint:fix
```

## 📊 Pipeline Stages

### Stage 1: Code Quality
- **Linting**: ESLint checks for code style and potential issues
- **Testing**: Unit and integration tests for all services
- **Coverage**: Test coverage reporting

### Stage 2: Build & Package
- **Docker Builds**: Builds containerized images for all services
- **Cache Optimization**: Uses GitHub Actions cache for faster builds
- **Multi-platform**: Supports multiple architectures

### Stage 3: Integration Testing
- **Service Communication**: Tests inter-service communication
- **API Endpoints**: Validates all API endpoints
- **Database Integration**: Tests database connectivity and operations

### Stage 4: Security & Quality
- **Vulnerability Scanning**: Trivy security scanner
- **Dependency Analysis**: Checks for known vulnerabilities
- **Code Quality**: Automated code review checks

### Stage 5: Deployment
- **Staging Deployment**: Automatic deployment to staging environment
- **Health Checks**: Validates deployment success
- **Rollback Capability**: Automatic rollback on failure

## 🔧 Customization

### Adding New Services

1. **Update Matrix Strategy**:
```yaml
strategy:
  matrix:
    service: [ticket-service, ai-service, frontend, new-service]
```

2. **Add Build Job**:
```yaml
- name: Build new-service
  uses: docker/build-push-action@v5
  with:
    context: ./new-service
    push: false
    tags: new-service:latest
```

### Custom Notifications

Add notification steps to workflows:

```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    channel: '#deployments'
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Environment-Specific Deployments

Create environment-specific workflows:

```yaml
- name: Deploy to Production
  if: github.ref == 'refs/heads/main'
  run: |
    # Production deployment commands
```

## 📈 Monitoring & Metrics

### Pipeline Metrics
- **Build Time**: Track build duration
- **Test Coverage**: Monitor test coverage trends
- **Success Rate**: Track pipeline success rates
- **Deployment Frequency**: Monitor deployment cadence

### Quality Gates
- **Test Coverage**: Minimum 80% coverage required
- **Security Scan**: Zero high/critical vulnerabilities
- **Performance**: Response time under 2 seconds
- **Code Quality**: Zero linting errors

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Check Docker build logs
   docker-compose build --no-cache
   
   # Verify Dockerfile syntax
   docker build --dry-run .
   ```

2. **Test Failures**:
   ```bash
   # Run tests locally
   npm test
   
   # Check environment variables
   echo $PERPLEXITY_API_KEY
   ```

3. **Integration Test Failures**:
   ```bash
   # Start services locally
   docker-compose up -d
   
   # Check service health
   curl http://localhost:5001/health
   ```

### Debug Mode

Enable debug logging in workflows:

```yaml
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

## 🔒 Security Considerations

### Secrets Management
- Never commit secrets to code
- Use GitHub Secrets for sensitive data
- Rotate secrets regularly
- Use least privilege access

### Container Security
- Scan images for vulnerabilities
- Use minimal base images
- Implement security best practices
- Regular security updates

### Access Control
- Limit workflow permissions
- Use OIDC for cloud deployments
- Implement proper IAM policies
- Audit access regularly

## 📚 Best Practices

### Code Quality
- Write comprehensive tests
- Maintain high test coverage
- Follow coding standards
- Regular code reviews

### Pipeline Efficiency
- Use caching strategies
- Parallel job execution
- Optimize build times
- Regular dependency updates

### Deployment Strategy
- Blue-green deployments
- Canary releases
- Automated rollbacks
- Health check monitoring

## 🎯 Next Steps

### Immediate Improvements
1. **Add Performance Testing**: Implement load testing
2. **Enhanced Security**: Add SAST/DAST scanning
3. **Monitoring**: Add application monitoring
4. **Documentation**: Auto-generate API docs

### Long-term Goals
1. **Multi-environment**: Production deployment pipeline
2. **Advanced Testing**: E2E and chaos engineering
3. **Observability**: Distributed tracing and logging
4. **Compliance**: SOC2 and security compliance

## 📞 Support

For pipeline issues or questions:
1. Check GitHub Actions logs
2. Review this documentation
3. Create an issue in the repository
4. Contact the development team

---

**Last Updated**: $(date)
**Pipeline Version**: 1.0.0
