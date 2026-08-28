#!/bin/sh
# Creates Gitea's role and database inside the SAME Postgres server that holds
# the pyquest progress database. Spec §6.1: "gitea | Self-hosted git remote,
# backed by the same Postgres". One server, two databases, two roles — not a
# second Postgres instance.
#
# WHEN THIS RUNS: only on the very first boot, when the postgres_data volume is
# empty. Postgres' entrypoint ignores /docker-entrypoint-initdb.d entirely once
# the data directory is initialised. If you change GITEA_DB_* after first boot
# you must apply the change by hand, or destroy the volume and start over.
# See infra/README.md, "Changing the Gitea database credentials".
set -eu

: "${GITEA_DB_NAME:?GITEA_DB_NAME must be set}"
: "${GITEA_DB_USER:?GITEA_DB_USER must be set}"
: "${GITEA_DB_PASSWORD:?GITEA_DB_PASSWORD must be set}"

echo "initdb: creating role '${GITEA_DB_USER}' and database '${GITEA_DB_NAME}'"

# :'x' quotes as a string literal, :"x" quotes as an identifier. Both are done
# by psql itself, so a password containing quotes cannot break out.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
     -v gitea_user="$GITEA_DB_USER" \
     -v gitea_pass="$GITEA_DB_PASSWORD" \
     -v gitea_db="$GITEA_DB_NAME" <<'EOSQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'gitea_user', :'gitea_pass')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'gitea_user') \gexec

SELECT format('CREATE DATABASE %I OWNER %I ENCODING ''UTF8''', :'gitea_db', :'gitea_user')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'gitea_db') \gexec

SELECT format('GRANT ALL PRIVILEGES ON DATABASE %I TO %I', :'gitea_db', :'gitea_user') \gexec
EOSQL

# Gitea needs to create tables in the public schema. On Postgres 15+ the public
# schema is no longer world-writable, so the owner grant has to be explicit.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$GITEA_DB_NAME" \
     -v gitea_user="$GITEA_DB_USER" <<'EOSQL'
SELECT format('ALTER SCHEMA public OWNER TO %I', :'gitea_user') \gexec
EOSQL

echo "initdb: gitea database ready"
