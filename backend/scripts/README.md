# Utility Scripts

This directory contains utility scripts for managing the database and downloaded files.

## Available Scripts

### `reset-db.sh`
Resets the database by dropping all data and reapplying migrations.

```bash
./scripts/reset-db.sh
```

**What it does:**
- Drops all database tables
- Reapplies all Prisma migrations
- Regenerates Prisma Client

**Use this when:**
- You want to clear all metadata but keep downloaded JAR files
- You need to fix database schema issues
- You want to start fresh with data ingestion

---

### `clear-files.sh`
Removes all downloaded JAR files while preserving database metadata.

```bash
./scripts/clear-files.sh
```

**What it does:**
- Deletes all files in the storage directory
- Keeps database metadata intact

**Use this when:**
- You want to free up disk space
- You need to re-download files
- You want to test download stages without re-ingesting metadata

---

### `reset-all.sh`
Complete reset - clears both database and downloaded files.

```bash
./scripts/reset-all.sh
```

**What it does:**
- Resets the database (drops and recreates)
- Removes all downloaded JAR files
- Regenerates Prisma Client

**Use this when:**
- You want a complete fresh start
- You're testing the entire pipeline from scratch
- You need to clear everything

---

## Quick Reference

| Task | Script | Database | Files |
|------|--------|----------|-------|
| Clear database only | `reset-db.sh` | ✅ Reset | ⏭️ Kept |
| Clear files only | `clear-files.sh` | ⏭️ Kept | ✅ Removed |
| Clear everything | `reset-all.sh` | ✅ Reset | ✅ Removed |

---

## Examples

### Scenario 1: Testing metadata changes
You modified Stage 1 and want to test it without re-downloading files:

```bash
./scripts/reset-db.sh
# Then run Stage 1
```

### Scenario 2: Testing download logic
You modified Stage 2/3 and want to re-download files:

```bash
./scripts/clear-files.sh
# Then run Stage 2 or Stage 3
```

### Scenario 3: Complete fresh start
You want to start from scratch:

```bash
./scripts/reset-all.sh
# Then run Stage 1
```

---

## Notes

- All scripts must be run from the backend directory or will automatically change to it
- The scripts use `JAR_STORAGE_PATH` environment variable or default to `./storage`
- All operations use `--force` flag to avoid confirmation prompts
