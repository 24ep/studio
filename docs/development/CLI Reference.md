# CLI Reference

**Project:** HRI Enterprise
**Version:** 1.0
**Last Updated:** December 16, 2025
**Status:** Active
**Classification:** Internal

---

---

## 1. System Settings Management CLI

A backdoor CLI tool to manage system settings, including enabling/disabling basic authentication when locked out of the system.

### 1.1 Purpose

This CLI tool provides a way to manage system settings directly from the command line, bypassing the web UI. This is especially useful when:
- You're locked out of the system (e.g., basic auth is disabled)
- You need to make emergency configuration changes
- You're running automated scripts or deployments
- The web UI is unavailable

### 1.2 Prerequisites

1. Node.js installed
2. Database connection configured via `DATABASE_URL` or `POSTGRES_URL` environment variable
3. Environment variables loaded (via `.env.local` or `.env` file)
4. Admin user account with password authentication enabled

---

## 2. Usage

### 2.1 Direct Node.js Execution

```bash
# Show help
node scripts/manage-system-settings.js

# List all settings
node scripts/manage-system-settings.js list

# Get a specific setting
node scripts/manage-system-settings.js get basicAuthEnabled

# Set a setting
node scripts/manage-system-settings.js set basicAuthEnabled true

# Enable basic auth (convenience command)
node scripts/manage-system-settings.js enable-basic-auth

# Disable basic auth (convenience command)
node scripts/manage-system-settings.js disable-basic-auth
```

### 2.2 Using NPM Scripts

```bash
# List all settings
npm run settings:list

# Get a specific setting (add key as argument)
npm run settings:get basicAuthEnabled

# Set a setting (add key and value as arguments)
npm run settings:set basicAuthEnabled true

# Enable basic auth
npm run settings:enable-basic-auth

# Disable basic auth
npm run settings:disable-basic-auth
```

---

## 3. Commands Reference

### 3.1 `list`

Lists all system settings in a formatted table.

**Options:**
- `--json` - Output in JSON format

**Examples:**
```bash
node scripts/manage-system-settings.js list
node scripts/manage-system-settings.js list --json
```

### 3.2 `get <key>`

Retrieves a specific system setting by key.

**Options:**
- `--json` - Output in JSON format

**Examples:**
```bash
node scripts/manage-system-settings.js get basicAuthEnabled
node scripts/manage-system-settings.js get basicAuthEnabled --json
```

### 3.3 `set <key> <value>`

Sets or updates a system setting.

**Examples:**
```bash
node scripts/manage-system-settings.js set basicAuthEnabled true
node scripts/manage-system-settings.js set maxConcurrentProcessors 10
node scripts/manage-system-settings.js set appName "My App"
```

### 3.4 `enable-basic-auth`

Convenience command to enable basic username/password authentication.

**Example:**
```bash
node scripts/manage-system-settings.js enable-basic-auth
```

### 3.5 `disable-basic-auth`

Convenience command to disable basic username/password authentication.

**Example:**
```bash
node scripts/manage-system-settings.js disable-basic-auth
```

---

## 4. Authentication

The CLI requires admin authentication by default. You can authenticate in two ways:

### 4.1 Interactive Mode (Recommended)

The CLI will prompt for admin email and password:
```bash
node scripts/manage-system-settings.js list
# Prompts: Admin Email: 
# Prompts: Password: (hidden input)
```

### 4.2 Non-Interactive Mode

Provide credentials via command line arguments:
```bash
node scripts/manage-system-settings.js list --email admin@example.com --password yourpassword
```

### 4.3 Emergency Bypass

Use `--no-auth` flag only in true emergency situations when you cannot authenticate:
```bash
node scripts/manage-system-settings.js enable-basic-auth --no-auth
```

**Authentication Requirements:**
- User must exist in the database
- User must have password authentication enabled (not Azure AD only)
- User must have `Admin` role OR have `SYSTEM_SETTINGS_EDIT` or `SYSTEM_SETTINGS_VIEW` permissions
- User account must be active

---

## 5. Common Use Cases

### 5.1 Emergency: Re-enable Basic Auth

If you've disabled basic auth and can't log in via Azure AD:

```bash
node scripts/manage-system-settings.js enable-basic-auth
```

### 5.2 Check Current Basic Auth Status

```bash
node scripts/manage-system-settings.js get basicAuthEnabled
```

### 5.3 View All Settings

```bash
node scripts/manage-system-settings.js list
```

### 5.4 Export Settings to JSON

```bash
node scripts/manage-system-settings.js list --json > settings-backup.json
```

### 5.5 Complete Workflow: Disable and Re-enable Basic Auth

```bash
# 1. Check current status
node scripts/manage-system-settings.js get basicAuthEnabled

# 2. Disable basic auth
node scripts/manage-system-settings.js disable-basic-auth

# 3. Verify it's disabled
node scripts/manage-system-settings.js get basicAuthEnabled

# 4. Re-enable basic auth (if needed)
node scripts/manage-system-settings.js enable-basic-auth
```

### 5.6 Batch Operations

You can create a simple shell script for batch operations:

```bash
#!/bin/bash
node scripts/manage-system-settings.js set basicAuthEnabled true
node scripts/manage-system-settings.js set jobMatchFeatureEnabled true
node scripts/manage-system-settings.js set processQueueEnabled true
```

---

## 6. Security Considerations

⚠️ **Important Security Notes:**

### 6.1 Authentication
The CLI now requires admin authentication by default. This provides an additional layer of security while maintaining the backdoor functionality.

### 6.2 Access Control
Even with authentication, ensure:
- Only trusted administrators have access to the server
- Database credentials are kept secure
- The script file has appropriate file permissions

### 6.3 Emergency Bypass
The `--no-auth` flag should only be used in true emergency situations:
- When you're completely locked out and cannot authenticate
- When the database is accessible but authentication is broken
- Document any use of this flag for audit purposes

### 6.4 Audit Trail
Changes made via this CLI are not automatically logged to the audit log. Consider:
- Documenting changes manually
- Reviewing database logs
- Using version control for configuration changes

### 6.5 Backup
Before making critical changes, consider:
- Exporting current settings: `node scripts/manage-system-settings.js list --json > backup.json`
- Testing changes in a development environment first

### 6.6 File Permissions
On Unix/Linux systems, ensure the script has appropriate permissions:
```bash
chmod 750 scripts/manage-system-settings.js
```

### 6.7 Password Security
When using non-interactive mode, be aware that:
- Passwords may be visible in process lists
- Consider using environment variables or secure credential storage
- Clear command history after use

---

## 7. Troubleshooting

### 7.1 Database Connection Error

If you see connection errors:
1. Verify `DATABASE_URL` or `POSTGRES_URL` is set correctly
2. Check that the database is running and accessible
3. Verify network connectivity and firewall rules
4. Check SSL settings if using a remote database

### 7.2 Setting Not Found

If a setting doesn't exist, the `set` command will create it. The `get` command will show a warning if the setting doesn't exist.

### 7.3 Permission Denied

On Unix/Linux systems, you may need to make the script executable:
```bash
chmod +x scripts/manage-system-settings.js
```

---

## 8. Related Documentation

- [Installation Guide](./INSTALLATION.md) - Setup and deployment
- [Security](./SECURITY.md) - Security implementation
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions
