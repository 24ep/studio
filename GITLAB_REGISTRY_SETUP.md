# GitLab Self-Hosted Registry Setup Guide

## Overview

This guide explains how to configure your Jenkins pipeline to use GitLab's self-hosted container registry for storing Docker images, and how Portainer can pull and deploy these images.

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Jenkins   │───▶│ GitLab      │───▶│ Portainer   │───▶│ Application │
│   Build     │    │ Registry    │    │ Deploy      │    │ Running     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## 1. GitLab Registry Configuration

### 1.1 Enable Container Registry in GitLab

1. **Go to your GitLab project**
   ```
   https://your-gitlab-instance.com/your-group/your-project
   ```

2. **Enable Container Registry**
   - Navigate to `Settings` → `General` → `Visibility, project features, permissions`
   - Enable `Container Registry`

### 1.2 Registry URL Format

For GitLab self-hosted, your registry URL will be:
```
registry.your-gitlab-domain.com
```

Example:
```
registry.gitlab.company.com
```

## 2. Jenkins Configuration

### 2.1 Update Jenkinsfile Environment Variables

Edit your `Jenkinsfile` and update these variables:

```groovy
environment {
    // GitLab Registry Configuration
    GITLAB_REGISTRY = 'registry.your-gitlab-domain.com'
    GITLAB_NAMESPACE = 'your-group/your-project'
    GITLAB_REGISTRY_URL = "https://${GITLAB_REGISTRY}"
}
```

### 2.2 Create GitLab Registry Credentials in Jenkins

1. **Go to Jenkins Dashboard**
2. **Navigate to** `Manage Jenkins` → `Manage Credentials`
3. **Click** `System` → `Global credentials` → `Add Credentials`
4. **Configure:**
   - **Kind**: `Username with password`
   - **Scope**: `Global`
   - **Username**: Your GitLab username
   - **Password**: Your GitLab personal access token
   - **ID**: `gitlab-registry-credentials`
   - **Description**: `GitLab Container Registry Credentials`

### 2.3 Update Jenkinsfile Credentials

Update the push stage in your `Jenkinsfile`:

```groovy
stage('Push to Registry') {
    when {
        anyOf {
            branch 'main'
            branch 'master'
            branch 'dev'
            branch 'develop'
        }
    }
    steps {
        echo '📤 Pushing to GitLab registry...'
        
        script {
            // Tag for registry
            sh "docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${GITLAB_REGISTRY}/${GITLAB_NAMESPACE}/${DOCKER_IMAGE}:${DOCKER_TAG}"
            sh "docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${GITLAB_REGISTRY}/${GITLAB_NAMESPACE}/${DOCKER_IMAGE}:latest"
            
            // Push to registry
            docker.withRegistry("${GITLAB_REGISTRY_URL}", 'gitlab-registry-credentials') {
                sh "docker push ${GITLAB_REGISTRY}/${GITLAB_NAMESPACE}/${DOCKER_IMAGE}:${DOCKER_TAG}"
                sh "docker push ${GITLAB_REGISTRY}/${GITLAB_NAMESPACE}/${DOCKER_IMAGE}:latest"
            }
        }
    }
}
```

## 3. Portainer Configuration

### 3.1 Add GitLab Registry to Portainer

1. **Log into Portainer**
2. **Go to** `Settings` → `Registries`
3. **Click** `Add registry`
4. **Configure:**
   - **Name**: `GitLab Registry`
   - **Registry Type**: `Custom registry`
   - **URL**: `https://registry.your-gitlab-domain.com`
   - **Authentication**: `Yes`
   - **Username**: Your GitLab username
   - **Password**: Your GitLab personal access token

### 3.2 Update Docker Compose for Portainer

The generated `docker-compose.portainer.yml` will automatically use the GitLab registry:

```yaml
services:
  app:
    image: registry.your-gitlab-domain.com/your-group/your-project/candidate-matching:${BUILD_NUMBER}
    # ... rest of configuration
```

## 4. Where Files Are Stored

### 4.1 Docker Images (Build Artifacts)
- **Location**: GitLab Container Registry
- **Path**: `registry.your-gitlab-domain.com/your-group/your-project/candidate-matching:tag`
- **Storage**: GitLab server storage
- **Retention**: Controlled by GitLab project settings

### 4.2 Build Cache & Temporary Files
- **Location**: Jenkins workspace
- **Storage**: Jenkins server
- **Retention**: Cleaned after each build

### 4.3 Source Code
- **Location**: GitLab repository
- **Storage**: GitLab server
- **Retention**: Permanent (unless deleted)

## 5. GitLab Personal Access Token Setup

### 5.1 Create Personal Access Token

1. **Go to GitLab** → `User Settings` → `Access Tokens`
2. **Create new token:**
   - **Token name**: `jenkins-registry-access`
   - **Scopes**: 
     - ✅ `read_registry`
     - ✅ `write_registry`
   - **Expiration date**: Set as needed
3. **Copy the token** (you won't see it again)

### 5.2 Use Token in Jenkins

Use this token as the password in Jenkins credentials.

## 6. Registry Management

### 6.1 View Images in GitLab

1. **Go to your project** → `Packages and registries` → `Container Registry`
2. **View all images** and tags
3. **Delete old images** to save space

### 6.2 Registry Cleanup Policy

Create `.gitlab-ci.yml` for automatic cleanup:

```yaml
# .gitlab-ci.yml
variables:
  DOCKER_DRIVER: overlay2

cleanup:
  stage: cleanup
  image: registry.gitlab.com/gitlab-org/incubation-engineering/mobile-devops/download-schemas:latest
  services:
    - docker:20.10.16-dind
  variables:
    DOCKER_HOST: tcp://docker:2376
    DOCKER_TLS_CERTDIR: "/certs"
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - |
      docker run --rm \
        -v /var/run/docker.sock:/var/run/docker.sock \
        registry.gitlab.com/gitlab-org/incubation-engineering/mobile-devops/download-schemas:latest \
        /bin/sh -c "
          docker system prune -f
          docker image prune -f --filter 'until=24h'
        "
  only:
    - schedules
```

## 7. Troubleshooting

### 7.1 Common Issues

**Issue**: `unauthorized: authentication required`
**Solution**: Check GitLab credentials in Jenkins

**Issue**: `manifest unknown`
**Solution**: Ensure image exists in registry before pulling

**Issue**: `connection refused`
**Solution**: Verify GitLab registry URL and network connectivity

### 7.2 Debug Commands

```bash
# Test registry connection
docker login registry.your-gitlab-domain.com

# List images in registry
curl -u username:token https://registry.your-gitlab-domain.com/v2/your-group/your-project/candidate-matching/tags/list

# Check image details
docker pull registry.your-gitlab-domain.com/your-group/your-project/candidate-matching:latest
```

## 8. Security Best Practices

1. **Use Personal Access Tokens** instead of passwords
2. **Set token expiration** dates
3. **Limit token scopes** to minimum required
4. **Regular cleanup** of old images
5. **Monitor registry usage** and storage

## 9. Monitoring and Maintenance

### 9.1 Registry Health Checks

```bash
# Check registry status
curl -f https://registry.your-gitlab-domain.com/v2/

# Check storage usage
docker system df
```

### 9.2 Backup Strategy

- **GitLab backups** include registry data
- **Regular backups** of GitLab instance
- **Test restore procedures** periodically

## 10. Cost Optimization

1. **Set image retention policies**
2. **Use multi-stage builds** to reduce image size
3. **Regular cleanup** of unused images
4. **Monitor storage usage**

---

## Summary

- **Build files (Docker images)**: Stored in GitLab Container Registry
- **Source code**: Stored in GitLab repository
- **Temporary build files**: Stored on Jenkins server (cleaned after build)
- **Portainer**: Pulls images from GitLab registry for deployment

This setup provides a centralized, secure, and scalable solution for managing your application's container images. 