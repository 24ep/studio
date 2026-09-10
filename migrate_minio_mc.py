#!/usr/bin/env python3
"""
MinIO Mirror Wrapper (mc)
=========================
A wrapper script that automatically downloads and uses the official MinIO Client (mc)
to perform robust, exact mirroring of buckets (including all metadata).

Usage:
    python migrate_minio_mc.py [--env-file .env.migration]

This script will:
1. Download 'mc' binary if not found.
2. Read source/dest credentials from environment file.
3. Configure mc aliases.
4. Run 'mc mirror --preserve --overwrite' to clone the bucket.
"""

import os
import sys
import platform
import subprocess
import logging
import urllib.request
import argparse
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

def get_mc_binary_url():
    """Get the download URL for the mc binary based on the current OS."""
    system = platform.system().lower()
    machine = platform.machine().lower()

    if system == "windows":
        return "https://dl.min.io/client/mc/release/windows-amd64/mc.exe", "mc.exe"
    elif system == "linux":
        if machine in ["x86_64", "amd64"]:
            return "https://dl.min.io/client/mc/release/linux-amd64/mc", "mc"
        elif machine in ["aarch64", "arm64"]:
            return "https://dl.min.io/client/mc/release/linux-arm64/mc", "mc"
    elif system == "darwin":
        if machine in ["x86_64", "amd64"]:
            return "https://dl.min.io/client/mc/release/darwin-amd64/mc", "mc"
        elif machine in ["arm64"]:
            return "https://dl.min.io/client/mc/release/darwin-arm64/mc", "mc"
    
    raise OSError(f"Unsupported OS/Architecture: {system} {machine}")

def ensure_mc_binary(script_dir: Path) -> Path:
    """Download mc binary if it doesn't exist."""
    url, filename = get_mc_binary_url()
    mc_path = script_dir / filename
    
    if mc_path.exists():
        logger.info(f"MinIO Client (mc) found at: {mc_path}")
        return mc_path
    
    logger.info(f"Downloading MinIO Client from: {url}")
    try:
        urllib.request.urlretrieve(url, mc_path)
        
        # Make executable on Linux/Mac
        if platform.system().lower() != "windows":
            os.chmod(mc_path, 0o755)
            
        logger.info(f"✓ Downloaded mc to: {mc_path}")
        return mc_path
    except Exception as e:
        logger.error(f"Failed to download mc: {e}")
        sys.exit(1)

# User Configurable Parameters (Override .env if set here)
# User Configurable Parameters (Override .env if set here)
SOURCE_ENDPOINT = ""
SOURCE_ACCESS_KEY = ""
SOURCE_SECRET_KEY = ""
SOURCE_BUCKET = ""
SOURCE_SECURE = False     # Set to False if using http

DEST_ENDPOINT = ""
DEST_ACCESS_KEY = ""
DEST_SECRET_KEY = ""
DEST_BUCKET = ""
DEST_SECURE = False


def load_env_config(env_file: str) -> dict:
    """Load configuration from environment file."""
    config = {}
    
    # Try python-dotenv first
    try:
        from dotenv import load_dotenv
        load_dotenv(env_file)
    except ImportError:
        pass
            
    if os.path.exists(env_file) and not 'dotenv' in sys.modules:
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip().strip('"\'')
    
    # Priority: 1. Hardcoded Variables (above) -> 2. Environment Variables -> 3. Defaults
    
    # Source configuration
    config["source_endpoint"] = SOURCE_ENDPOINT or os.getenv("SOURCE_MINIO_ENDPOINT", "")
    config["source_access_key"] = SOURCE_ACCESS_KEY or os.getenv("SOURCE_MINIO_ACCESS_KEY", "")
    config["source_secret_key"] = SOURCE_SECRET_KEY or os.getenv("SOURCE_MINIO_SECRET_KEY", "")
    config["source_bucket"] = SOURCE_BUCKET or os.getenv("SOURCE_MINIO_BUCKET", "")
    
    # Handle boolean logic safely
    if SOURCE_ENDPOINT: # If hardcoded, used hardcoded bool
        config["source_secure"] = SOURCE_SECURE
    else:
        config["source_secure"] = os.getenv("SOURCE_MINIO_USE_SSL", "true").lower() == "true"
    
    # Destination configuration
    config["dest_endpoint"] = DEST_ENDPOINT or os.getenv("DEST_MINIO_ENDPOINT", "")
    config["dest_access_key"] = DEST_ACCESS_KEY or os.getenv("DEST_MINIO_ACCESS_KEY", "")
    config["dest_secret_key"] = DEST_SECRET_KEY or os.getenv("DEST_MINIO_SECRET_KEY", "")
    config["dest_bucket"] = DEST_BUCKET or os.getenv("DEST_MINIO_BUCKET", "")
    
    if DEST_ENDPOINT:
         config["dest_secure"] = DEST_SECURE
    else:
        config["dest_secure"] = os.getenv("DEST_MINIO_USE_SSL", "true").lower() == "true"
    
    return config

def run_mc_command(mc_path: Path, args: list, env: dict = None):
    """Run an mc command."""
    cmd = [str(mc_path)] + args
    try:
        # Pass environment variables if needed (e.g. for avoiding prompts)
        subprocess.run(cmd, check=True, env=env or os.environ.copy())
    except subprocess.CalledProcessError as e:
        logger.error(f"Command failed: {' '.join(cmd)}")
        sys.exit(e.returncode)

def main():
    parser = argparse.ArgumentParser(description="Mirror MinIO buckets using mc")
    parser.add_argument("--env-file", default=".env.migration", help="Path to .env file")
    parser.add_argument("--dry-run", action="store_true", help="Perform a dry run")
    args = parser.parse_args()
    
    script_dir = Path(__file__).parent.absolute()
    
    # 1. Ensure mc binary
    mc_path = ensure_mc_binary(script_dir)
    
    # 2. Load config
    env_file = args.env_file
    if not os.path.exists(env_file):
        # Try looking in parent dir
        parent_env = script_dir.parent / env_file
        if parent_env.exists():
            env_file = str(parent_env)
        else:
            logger.warning(f"Environment file not found: {env_file}. Using hardcoded values if available.")
            # Proceed without env file
            
    config = load_env_config(env_file)
    logger.info(f"Loaded config from: {env_file} (if exists)")
    
    # Check required vars
    required_vars = [
        "source_endpoint", "source_access_key", "source_secret_key", "source_bucket",
        "dest_endpoint", "dest_access_key", "dest_secret_key", "dest_bucket"
    ]
    missing = [v for v in required_vars if not config.get(v)]
    if missing:
        logger.error(f"Missing required config variables: {', '.join(missing)}")
        sys.exit(1)
        
    # 3. Configure Aliases
    # Construct URLs (http vs https)
    source_proto = "https" if config["source_secure"] else "http"
    dest_proto = "https" if config["dest_secure"] else "http"
    
    source_url = f"{source_proto}://{config['source_endpoint']}"
    dest_url = f"{dest_proto}://{config['dest_endpoint']}"
    
    logger.info("Configuring MinIO aliases...")
    run_mc_command(mc_path, [
        "alias", "set", "source", source_url, 
        config["source_access_key"], config["source_secret_key"]
    ])
    
    run_mc_command(mc_path, [
        "alias", "set", "dest", dest_url, 
        config["dest_access_key"], config["dest_secret_key"]
    ])
    
    # 4. Run Mirror
    logger.info("="*60)
    logger.info(f"Starting Mirror: {config['source_bucket']} -> {config['dest_bucket']}")
    logger.info("="*60)
    
    mirror_cmd = ["mirror", "--preserve", "--overwrite"]
    if args.dry_run:
        mirror_cmd.append("--dry-run")
        
    # Source and Dest paths
    source_path = f"source/{config['source_bucket']}"
    dest_path = f"dest/{config['dest_bucket']}"
    
    mirror_cmd.extend([source_path, dest_path])
    
    run_mc_command(mc_path, mirror_cmd)
    
    logger.info("="*60)
    logger.info("Mirror Complete!")

if __name__ == "__main__":
    main()
