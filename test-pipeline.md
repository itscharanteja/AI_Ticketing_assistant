# Pipeline Test File

This file is used to test the CI/CD pipeline by making a small change and pushing it.

## Test Scenarios

### 1. Push to Main Branch
- Should trigger full CI/CD pipeline
- Should run all tests and builds
- Should deploy to staging (if configured)

### 2. Create Pull Request
- Should trigger CI/CD pipeline
- Should run tests and builds
- Should NOT deploy to staging

### 3. Push Version Tag
- Should trigger release workflow
- Should create GitHub release
- Should generate release notes

## How to Test

1. **Test Push to Main:**
   ```bash
   git add test-pipeline.md
   git commit -m "test: trigger CI/CD pipeline"
   git push origin main
   ```

2. **Test Pull Request:**
   ```bash
   git checkout -b test-pr
   # Make changes
   git push origin test-pr
   # Create PR on GitHub
   ```

3. **Test Release:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

## Expected Results

- ✅ All tests should pass
- ✅ Docker builds should succeed
- ✅ Integration tests should pass
- ✅ Security scan should complete
- ✅ Performance tests should run
