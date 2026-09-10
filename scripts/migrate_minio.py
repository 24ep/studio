#!/usr/bin/env python3
"""
MinIO Data Migration Script
===========================
Migrate data from one MinIO bucket/connection to another.

Usage:
    python migrate_minio.py [options]
    
Examples:
    # Using command line arguments
    python migrate_minio.py \
        --source-endpoint 10.0.10.57:8621 \
        --source-access-key CHANGE_ME_SOURCE_ACCESS_KEY \
        --source-secret-key CHANGE_ME_SOURCE_SECRET_KEY \
        --source-bucket studio-dev \
        --dest-endpoint new-server:9000 \
        --dest-access-key newadmin \
        --dest-secret-key newsecret \
        --dest-bucket studio-prod
    
    # Using environment variables (create .env.migration file)
    python migrate_minio.py --env-file .env.migration
"""

import os
import sys
import argparse
import logging
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional
import urllib3

# Disable SSL warnings for self-signed certificates
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

try:
    from minio import Minio
    from minio.error import S3Error
except ImportError:
    print("Error: minio package not found. Install it with: pip install minio")
    sys.exit(1)

try:
    from dotenv import load_dotenv
except ImportError:
    print("Warning: python-dotenv not found. Install it with: pip install python-dotenv")
    load_dotenv = None

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


class MinioMigrator:
    """Handles migration of objects between MinIO instances/buckets."""
    
    def __init__(
        self,
        source_endpoint: str,
        source_access_key: str,
        source_secret_key: str,
        source_bucket: str,
        source_secure: bool,
        dest_endpoint: str,
        dest_access_key: str,
        dest_secret_key: str,
        dest_bucket: str,
        dest_secure: bool,
        prefix: str = "",
        workers: int = 4,
        dry_run: bool = False,
        skip_existing: bool = True,
    ):
        self.source_bucket = source_bucket
        self.dest_bucket = dest_bucket
        self.prefix = prefix
        self.workers = workers
        self.dry_run = dry_run
        self.skip_existing = skip_existing
        
        # Initialize source client
        self.source_client = Minio(
            source_endpoint,
            access_key=source_access_key,
            secret_key=source_secret_key,
            secure=source_secure,
        )
        
        # Initialize destination client
        self.dest_client = Minio(
            dest_endpoint,
            access_key=dest_access_key,
            secret_key=dest_secret_key,
            secure=dest_secure,
        )
        
        # Statistics
        self.stats = {
            "total": 0,
            "migrated": 0,
            "skipped": 0,
            "failed": 0,
            "bytes_transferred": 0,
        }
    
    def validate_connections(self) -> bool:
        """Validate connections to both source and destination."""
        try:
            # Check source bucket exists
            if not self.source_client.bucket_exists(self.source_bucket):
                logger.error(f"Source bucket '{self.source_bucket}' does not exist")
                return False
            logger.info(f"✓ Connected to source bucket: {self.source_bucket}")
            
            # Check/create destination bucket
            if not self.dest_client.bucket_exists(self.dest_bucket):
                if self.dry_run:
                    logger.info(f"[DRY RUN] Would create destination bucket: {self.dest_bucket}")
                else:
                    logger.info(f"Creating destination bucket: {self.dest_bucket}")
                    self.dest_client.make_bucket(self.dest_bucket)
            logger.info(f"✓ Connected to destination bucket: {self.dest_bucket}")
            
            return True
        except S3Error as e:
            logger.error(f"Connection validation failed: {e}")
            return False
    
    def get_existing_objects(self) -> dict:
        """Get dict of existing objects in destination bucket with their size and etag."""
        existing = {}
        try:
            for obj in self.dest_client.list_objects(self.dest_bucket, prefix=self.prefix, recursive=True):
                existing[obj.object_name] = {
                    "size": obj.size,
                    "etag": obj.etag,
                }
        except S3Error as e:
            logger.warning(f"Could not list destination objects: {e}")
        return existing
    
    def migrate_object(self, obj_name: str, obj_size: int, obj_etag: str, existing_objects: dict) -> tuple:
        """Migrate a single object from source to destination (differential sync)."""
        try:
            # Check if object exists and compare for differential sync
            if self.skip_existing and obj_name in existing_objects:
                dest_obj = existing_objects[obj_name]
                # Compare size and etag - skip if identical
                if dest_obj["size"] == obj_size and dest_obj["etag"] == obj_etag:
                    logger.debug(f"Skipping unchanged object: {obj_name}")
                    return ("skipped", obj_name, 0)
                else:
                    logger.info(f"Object changed, re-syncing: {obj_name} (size: {dest_obj['size']} -> {obj_size})")
            
            if self.dry_run:
                logger.info(f"[DRY RUN] Would migrate: {obj_name} ({self._format_size(obj_size)})")
                return ("migrated", obj_name, obj_size)
            
            # Get object from source
            response = self.source_client.get_object(self.source_bucket, obj_name)
            
            # Get content type and metadata from source object stat
            stat = self.source_client.stat_object(self.source_bucket, obj_name)
            content_type = stat.content_type or "application/octet-stream"
            metadata = stat.metadata or {}
            
            # Upload to destination
            self.dest_client.put_object(
                self.dest_bucket,
                obj_name,
                response,
                length=obj_size,
                content_type=content_type,
                metadata=metadata,
            )
            
            response.close()
            response.release_conn()
            
            logger.info(f"✓ Migrated: {obj_name} ({self._format_size(obj_size)})")
            return ("migrated", obj_name, obj_size)
            
        except S3Error as e:
            logger.error(f"✗ Failed to migrate {obj_name}: {e}")
            return ("failed", obj_name, 0)
        except Exception as e:
            logger.error(f"✗ Unexpected error migrating {obj_name}: {e}")
            return ("failed", obj_name, 0)
    
    def migrate(self) -> dict:
        """Execute the migration."""
        logger.info("=" * 60)
        logger.info("Starting MinIO Migration")
        logger.info("=" * 60)
        logger.info(f"Source bucket: {self.source_bucket}")
        logger.info(f"Destination bucket: {self.dest_bucket}")
        logger.info(f"Prefix filter: {self.prefix or '(all objects)'}")
        logger.info(f"Workers: {self.workers}")
        logger.info(f"Skip existing: {self.skip_existing}")
        logger.info(f"Dry run: {self.dry_run}")
        logger.info("=" * 60)
        
        # Validate connections
        if not self.validate_connections():
            return self.stats
        
        # Get existing objects in destination (with size and etag for differential sync)
        existing_objects = {}
        if self.skip_existing:
            logger.info("Scanning destination for existing objects...")
            existing_objects = self.get_existing_objects()
            logger.info(f"Found {len(existing_objects)} existing objects in destination")
        
        # List all objects to migrate (including etag for comparison)
        logger.info("Scanning source bucket for objects...")
        objects_to_migrate = []
        for obj in self.source_client.list_objects(self.source_bucket, prefix=self.prefix, recursive=True):
            objects_to_migrate.append((obj.object_name, obj.size, obj.etag))
        
        self.stats["total"] = len(objects_to_migrate)
        logger.info(f"Found {self.stats['total']} objects to process")
        
        if not objects_to_migrate:
            logger.info("No objects to migrate")
            return self.stats
        
        # Calculate total size
        total_size = sum(obj[1] for obj in objects_to_migrate)
        logger.info(f"Total size: {self._format_size(total_size)}")
        logger.info("-" * 60)
        
        # Execute migration with thread pool
        start_time = datetime.now()
        
        with ThreadPoolExecutor(max_workers=self.workers) as executor:
            futures = {
                executor.submit(self.migrate_object, obj_name, obj_size, obj_etag, existing_objects): obj_name
                for obj_name, obj_size, obj_etag in objects_to_migrate
            }
            
            for future in as_completed(futures):
                result, obj_name, size = future.result()
                if result == "migrated":
                    self.stats["migrated"] += 1
                    self.stats["bytes_transferred"] += size
                elif result == "skipped":
                    self.stats["skipped"] += 1
                elif result == "failed":
                    self.stats["failed"] += 1
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        # Print summary
        logger.info("=" * 60)
        logger.info("Migration Complete!")
        logger.info("=" * 60)
        logger.info(f"Total objects:     {self.stats['total']}")
        logger.info(f"Migrated:          {self.stats['migrated']}")
        logger.info(f"Skipped:           {self.stats['skipped']}")
        logger.info(f"Failed:            {self.stats['failed']}")
        logger.info(f"Data transferred:  {self._format_size(self.stats['bytes_transferred'])}")
        logger.info(f"Duration:          {duration:.2f} seconds")
        if duration > 0:
            speed = self.stats['bytes_transferred'] / duration
            logger.info(f"Speed:             {self._format_size(speed)}/s")
        logger.info("=" * 60)
        
        return self.stats
    
    @staticmethod
    def _format_size(size: int) -> str:
        """Format byte size to human readable string."""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size < 1024:
                return f"{size:.2f} {unit}"
            size /= 1024
        return f"{size:.2f} PB"


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Migrate MinIO bucket data between connections",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    
    # Source connection
    parser.add_argument("--source-endpoint", help="Source MinIO endpoint (e.g., 10.0.10.57:8621)")
    parser.add_argument("--source-access-key", help="Source access key")
    parser.add_argument("--source-secret-key", help="Source secret key")
    parser.add_argument("--source-bucket", help="Source bucket name")
    parser.add_argument("--source-secure", action="store_true", default=False, help="Use SSL for source connection")
    
    # Destination connection
    parser.add_argument("--dest-endpoint", help="Destination MinIO endpoint")
    parser.add_argument("--dest-access-key", help="Destination access key")
    parser.add_argument("--dest-secret-key", help="Destination secret key")
    parser.add_argument("--dest-bucket", help="Destination bucket name")
    parser.add_argument("--dest-secure", action="store_true", default=False, help="Use SSL for destination connection")
    
    # Migration options
    parser.add_argument("--prefix", default="", help="Only migrate objects with this prefix")
    parser.add_argument("--workers", type=int, default=4, help="Number of parallel workers (default: 4)")
    parser.add_argument("--dry-run", action="store_true", help="Simulate migration without actually copying")
    parser.add_argument("--no-skip-existing", action="store_true", help="Overwrite existing objects in destination")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose output")
    
    # Environment file
    parser.add_argument("--env-file", help="Load settings from environment file")
    
    return parser.parse_args()


def load_env_config(env_file: str) -> dict:
    """Load configuration from environment file."""
    config = {}
    
    if load_dotenv:
        load_dotenv(env_file)
    else:
        # Manual .env parsing
        if os.path.exists(env_file):
            with open(env_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        os.environ[key.strip()] = value.strip().strip('"\'')
    
    # Source configuration
    config["source_endpoint"] = os.getenv("SOURCE_MINIO_ENDPOINT", "")
    config["source_access_key"] = os.getenv("SOURCE_MINIO_ACCESS_KEY", "")
    config["source_secret_key"] = os.getenv("SOURCE_MINIO_SECRET_KEY", "")
    config["source_bucket"] = os.getenv("SOURCE_MINIO_BUCKET", "")
    config["source_secure"] = os.getenv("SOURCE_MINIO_USE_SSL", "false").lower() == "true"
    
    # Destination configuration
    config["dest_endpoint"] = os.getenv("DEST_MINIO_ENDPOINT", "")
    config["dest_access_key"] = os.getenv("DEST_MINIO_ACCESS_KEY", "")
    config["dest_secret_key"] = os.getenv("DEST_MINIO_SECRET_KEY", "")
    config["dest_bucket"] = os.getenv("DEST_MINIO_BUCKET", "")
    config["dest_secure"] = os.getenv("DEST_MINIO_USE_SSL", "false").lower() == "true"
    
    return config


def main():
    args = parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Load from env file if specified
    env_config = {}
    if args.env_file:
        if not os.path.exists(args.env_file):
            logger.error(f"Environment file not found: {args.env_file}")
            sys.exit(1)
        env_config = load_env_config(args.env_file)
        logger.info(f"Loaded configuration from: {args.env_file}")
    
    # Merge command line args with env config (command line takes precedence)
    source_endpoint = args.source_endpoint or env_config.get("source_endpoint")
    source_access_key = args.source_access_key or env_config.get("source_access_key")
    source_secret_key = args.source_secret_key or env_config.get("source_secret_key")
    source_bucket = args.source_bucket or env_config.get("source_bucket")
    source_secure = args.source_secure or env_config.get("source_secure", False)
    
    dest_endpoint = args.dest_endpoint or env_config.get("dest_endpoint")
    dest_access_key = args.dest_access_key or env_config.get("dest_access_key")
    dest_secret_key = args.dest_secret_key or env_config.get("dest_secret_key")
    dest_bucket = args.dest_bucket or env_config.get("dest_bucket")
    dest_secure = args.dest_secure or env_config.get("dest_secure", False)
    
    # Validate required parameters
    required = [
        ("source-endpoint", source_endpoint),
        ("source-access-key", source_access_key),
        ("source-secret-key", source_secret_key),
        ("source-bucket", source_bucket),
        ("dest-endpoint", dest_endpoint),
        ("dest-access-key", dest_access_key),
        ("dest-secret-key", dest_secret_key),
        ("dest-bucket", dest_bucket),
    ]
    
    missing = [name for name, value in required if not value]
    if missing:
        logger.error(f"Missing required parameters: {', '.join(missing)}")
        logger.info("Use --help for usage information")
        sys.exit(1)
    
    # Create migrator and run
    migrator = MinioMigrator(
        source_endpoint=source_endpoint,
        source_access_key=source_access_key,
        source_secret_key=source_secret_key,
        source_bucket=source_bucket,
        source_secure=source_secure,
        dest_endpoint=dest_endpoint,
        dest_access_key=dest_access_key,
        dest_secret_key=dest_secret_key,
        dest_bucket=dest_bucket,
        dest_secure=dest_secure,
        prefix=args.prefix,
        workers=args.workers,
        dry_run=args.dry_run,
        skip_existing=not args.no_skip_existing,
    )
    
    stats = migrator.migrate()
    
    # Exit with error code if any failures
    if stats["failed"] > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
