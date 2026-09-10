# Kubernetes Deployment

This directory contains Kubernetes manifests for deploying the application.

## Namespace

All resources are deployed to the namespace configured in `00-namespace.yaml`.

## Common Labels

All resources use the following labels:
- `app.kubernetes.io/name: app`
- `app.kubernetes.io/version: "1.2.3"`
- `app.kubernetes.io/component: application`
- `app.kubernetes.io/part-of: app-stack`

## Deployment Files

### Core Resources (Apply in order)

1. **00-namespace.yaml** - Creates the application namespace
2. **01-configmap.yaml** - Application configuration
3. **02-secrets.yaml** - Sensitive data such as database, API, and storage credentials
4. **03-hri-app.yaml** - Main application deployment containing:
   - Deployment
   - Service
   - ServiceAccount
   - PodDisruptionBudget
   - ResourceQuota
   - LimitRange
5. **05-ingress.yaml** - Ingress configuration for external access

## Deployment Instructions

### Prerequisites

1. Ensure you have `kubectl` configured to access your Kubernetes cluster
2. Update the following files with your actual values:
   - **02-secrets.yaml**: Replace all base64 encoded secrets with your actual credentials
   - **01-configmap.yaml**: Update external database and storage hostnames
   - **05-ingress.yaml**: Update domain names

### Deploy All Resources

Apply all resources in the correct order:

```bash
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/02-secrets.yaml
kubectl apply -f k8s/03-hri-app.yaml
kubectl apply -f k8s/05-ingress.yaml
```

Or apply all at once:

```bash
kubectl apply -f k8s/
```

### Verify Deployment

Check the status of your deployments:

```bash
# Check pods
kubectl get pods -n <namespace>

# Check services
kubectl get svc -n <namespace>

# Check ingress
kubectl get ingress -n <namespace>

# Check HPA
kubectl get hpa -n <namespace>
```

## Configuration

### External Services

The application is configured to use external services:
### Image Configuration

Set the container image to your own registry and tag before deploying.

To use a different image tag, update the `image` field in:
- `03-hri-app.yaml`

## Resource Limits

### ResourceQuota (Namespace Level)
- CPU requests: 8 cores
- CPU limits: 16 cores
- Memory requests: 32Gi
- Memory limits: 64Gi

## Scaling

The application uses Horizontal Pod Autoscaler (HPA) settings within `03-hri-app.yaml` (if configured):
- Application deployment: 2-10 replicas

## Troubleshooting

### Check Pod Logs

```bash
# App logs
kubectl logs -f deployment/<deployment-name> -n <namespace>
```

### Check Resource Usage

```bash
kubectl top pods -n <namespace>
kubectl top nodes
```

### Describe Resources

```bash
kubectl describe deployment <deployment-name> -n <namespace>
```

## Cleanup

To remove all resources:

```bash
kubectl delete -f k8s/
```

Or delete the namespace (this will delete all resources):

```bash
kubectl delete namespace <namespace>
```

