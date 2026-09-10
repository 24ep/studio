# Backup & Recovery Procedures

**Project:** HRI Enterprise
**Version:** 1.0
**Last Updated:** December 16, 2025
**Status:** Active
**Classification:** Internal

---

---

## 1. Database Backup

### Manual Backup
```bash
# Create backup
docker exec postgres pg_dump -U user database > backup.sql

# Timestamped backup
docker exec postgres pg_dump -U user database > backup-$(date +%Y%m%d).sql

# Compressed backup
docker exec postgres pg_dump -U user database | gzip > backup.sql.gz
```

### Restore Backup
```bash
docker exec -i postgres psql -U user database < backup.sql
```

### Automated Backup
```bash
# Crontab (daily at 2 AM)
0 2 * * * docker exec postgres pg_dump -U user database | gzip > /backups/backup-$(date +\%Y\%m\%d).sql.gz
```

---

## 2. File Storage (MinIO) Backup

```bash
# Backup MinIO data
docker run --rm -v candidatrack_minio_data:/data -v $(pwd):/backup alpine tar czf /backup/minio-backup.tar.gz -C /data .

# Restore MinIO data
docker run --rm -v candidatrack_minio_data:/data -v $(pwd):/backup alpine tar xzf /backup/minio-backup.tar.gz -C /data
```

---

## 3. System Settings Backup

```bash
# Export settings
npm run settings:list --json > settings-backup.json
```

---

## 4. Backup Strategy

| Type | Frequency | Retention |
|------|-----------|-----------|
| Database | Daily | 30 days |
| File Storage | Daily | 30 days |
| Settings | Weekly | 90 days |

---

## 5. Disaster Recovery

1. Restore database from backup
2. Restore MinIO file storage
3. Restore system settings
4. Verify application health
5. Test critical workflows

---

## Related Docs
- [Installation](./INSTALLATION.md)
- [Security](./SECURITY.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
