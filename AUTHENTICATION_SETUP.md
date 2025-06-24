# Authentication Setup Guide

## Overview

CandiTrack supports two authentication methods:
1. **Username/Password Authentication** (Always Available)
2. **Azure AD Single Sign-On** (Optional)

## Default Configuration

By default, the application works with **username/password authentication only**. No additional configuration is required.

### Default Admin User
- **Email**: admin@ncc.com
- **Password**: nccadmin

## Username/Password Authentication

This method is **always enabled** and works out of the box. Users can sign in using their email and password stored in the database.

### Features:
- ✅ Always available
- ✅ No external dependencies
- ✅ Works with local database users
- ✅ Supports user roles and permissions
- ✅ Password hashing with bcrypt

## Azure AD Single Sign-On (Optional)

Azure AD SSO is **optional** and only enabled when properly configured.

### When Azure AD is NOT configured:
- ✅ Application works normally with username/password
- ✅ No Azure AD button shown on login page
- ✅ No errors or issues

### When Azure AD IS configured:
- ✅ Both authentication methods available
- ✅ Azure AD button appears on login page
- ✅ Users can choose between Azure AD or username/password

## Environment Variables

### Required (Always):
```bash
NEXTAUTH_SECRET=your-secure-secret-here
NEXTAUTH_URL=http://your-domain.com:9846
```

### Optional (Azure AD):
```bash
AZURE_AD_CLIENT_ID=your-azure-client-id
AZURE_AD_CLIENT_SECRET=your-azure-client-secret
AZURE_AD_TENANT_ID=your-azure-tenant-id
```

## Deployment Options

### Option 1: Username/Password Only (Recommended for most users)
```bash
# Only set required variables
NEXTAUTH_SECRET=your-secure-secret
NEXTAUTH_URL=http://your-server:9846

# Leave Azure AD variables unset or use defaults
AZURE_AD_CLIENT_ID=your_azure_ad_application_client_id
AZURE_AD_CLIENT_SECRET=your_azure_ad_client_secret_value
AZURE_AD_TENANT_ID=your_azure_ad_directory_tenant_id
```

### Option 2: With Azure AD SSO
```bash
# Set all variables with real Azure AD values
NEXTAUTH_SECRET=your-secure-secret
NEXTAUTH_URL=http://your-server:9846
AZURE_AD_CLIENT_ID=real-azure-client-id
AZURE_AD_CLIENT_SECRET=real-azure-client-secret
AZURE_AD_TENANT_ID=real-azure-tenant-id
```

## Portainer Deployment

When deploying to Portainer:

1. **For username/password only**: Use the default docker-compose.yml as-is
2. **For Azure AD**: Update the Azure AD environment variables in Portainer's stack settings

## Troubleshooting

### My-Tasks Board Loading Issue
If the my-tasks board is stuck loading, check:
1. ✅ `NEXTAUTH_SECRET` is set
2. ✅ `NEXTAUTH_URL` is correct
3. ✅ Database is running and accessible
4. ✅ User is authenticated

### Authentication Errors
- **"Configuration" error**: Missing `NEXTAUTH_SECRET` or `NEXTAUTH_URL`
- **"Access Denied"**: User not authenticated or insufficient permissions
- **Azure AD errors**: Only appear if Azure AD is configured but misconfigured

## Security Notes

- Always use a strong `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
- Change default admin password after first login
- Use HTTPS in production
- Regularly rotate secrets and passwords 