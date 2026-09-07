#!/bin/sh

# Local Docker uses the same migration/adoption path as production so a local
# environment cannot silently diverge through `prisma db push --accept-data-loss`.
# Set SKIP_SEED=false when explicit local seed data is desired.
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec /bin/sh "$SCRIPT_DIR/entrypoint.sh"
