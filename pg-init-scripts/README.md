# CandiTrack Database Initialization

This directory contains the database initialization scripts for CandiTrack, an applicant tracking system. The database will be automatically initialized when deployed through Docker/Portainer.

## Automatic Initialization (Recommended)

When deploying CandiTrack through **Portainer with Git integration**, the database will be automatically initialized on first startup. This is the recommended approach.

### How It Works

1. **Docker Compose Configuration**: The `docker-compose.yml` file mounts the `pg-init-scripts` directory to PostgreSQL's initialization directory (`/docker-entrypoint-initdb.d`)

2. **Automatic Execution**: PostgreSQL automatically executes all `.sql` and `.sh` files in this directory when the database is first created

3. **One-Time Process**: Initialization only occurs when the `postgres_data` volume is empty (first deployment)

### What Gets Created

The initialization script (`init-db.sql`) creates:

- **Database Schema**: All tables, indexes, and relationships
- **Custom Types**: Enums for recruitment stages, user roles, etc.
- **Default Data**:
  - Admin user: `admin@canditrack.com`
  - Default recruitment stages (Applied, Screening, Interview, etc.)
  - System settings
  - User groups and permissions
- **Triggers**: Automatic timestamp updates
- **Functions**: Logging and utility functions

## Portainer Deployment

### Quick Start

1. **Clone and Prepare**:
   ```bash
   # Run the deployment script on your Ubuntu server
   chmod +x deploy-portainer.sh
   ./deploy-portainer.sh
   ```

2. **Configure Environment**:
   - Edit the generated `.env` file
   - Update `NEXTAUTH_URL` to your domain
   - Generate a secure `NEXTAUTH_SECRET`

3. **Deploy in Portainer**:
   - Open Portainer → Stacks → Add Stack
   - Upload `portainer-stack.yml`
   - Deploy the stack

4. **Verify Deployment**:
   ```bash
   ./health-check.sh
   ```

### Detailed Portainer Instructions

See `DEPLOYMENT_INSTRUCTIONS.md` for complete step-by-step instructions.

## Manual Initialization (Alternative)

If you need to manually initialize the database:

### Using Docker

```bash
# Run the initialization script manually
docker exec -i your_postgres_container psql -U devuser -d canditrack_db < pg-init-scripts/init-db.sql
```

### Using Direct Connection

```bash
# Connect to PostgreSQL and run the script
psql -h localhost -U devuser -d canditrack_db -f pg-init-scripts/init-db.sql
```

## Verification

After initialization, verify the setup:

```bash
# Check if tables were created
docker exec -i your_postgres_container psql -U devuser -d canditrack_db -c "\dt"

# Check if default data exists
docker exec -i your_postgres_container psql -U devuser -d canditrack_db -c "SELECT COUNT(*) FROM users;"
docker exec -i your_postgres_container psql -U devuser -d canditrack_db -c "SELECT COUNT(*) FROM recruitment_stages;"
```

## Troubleshooting

### Common Issues

1. **"psql: ... Is a directory" Error**:
   - Ensure the `pg-init-scripts` directory is properly mounted
   - Check file permissions on the initialization scripts

2. **Permission Denied**:
   - Verify the PostgreSQL user has proper permissions
   - Check Docker volume permissions

3. **Initialization Not Running**:
   - Ensure the `postgres_data` volume is empty (first deployment)
   - Check PostgreSQL logs: `docker logs your_postgres_container`

### Logs and Debugging

The initialization script includes comprehensive logging:

```bash
# View PostgreSQL logs
docker logs your_postgres_container

# Check initialization status
docker exec -i your_postgres_container psql -U devuser -d canditrack_db -c "SELECT * FROM system_settings;"
```

## File Structure

```
pg-init-scripts/
├── init-db.sql              # Main initialization script
├── init-database.sh         # Manual initialization script
└── README.md               # This file
```

## Security Notes

- **Default Credentials**: Change default passwords in production
- **Admin User**: The default admin user (`admin@canditrack.com`) has no password initially
- **Database Access**: Restrict database access in production environments
- **Backup**: Set up regular backups of the `postgres_data` volume

## Support

For deployment issues:

1. Check the application logs
2. Review the deployment instructions
3. Verify environment variables
4. Check PostgreSQL initialization logs
5. Run the health check script: `./health-check.sh`

## Default Access Information

- **Application**: http://your-server-ip:9846
- **Admin User**: admin@canditrack.com
- **MinIO Console**: http://your-server-ip:9848 (minioadmin/minio_secret_password)
- **PostgreSQL**: localhost:5432 (devuser/devpassword) 