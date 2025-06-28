#!/bin/sh

# Usage: ./wait-for-db.sh host:port [-- command args]

set -e

HOST_PORT=$1
shift

HOST=$(echo $HOST_PORT | cut -d: -f1)
PORT=$(echo $HOST_PORT | cut -d: -f2)

until nc -z "$HOST" "$PORT"; do
  echo "Waiting for $HOST:$PORT..."
  sleep 2
done

echo "$HOST:$PORT is available!"

exec "$@" 