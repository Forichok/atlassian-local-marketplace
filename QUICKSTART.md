# Quick Start Guide

## Get Started in 3 Steps

### 1. Start the Application

```bash
docker-compose up -d
```

Wait 30-60 seconds for services to initialize.

### 2. Access the Web UI

Open your browser:
- **Main UI**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin

### 3. Start Syncing

In the Admin panel:

1. **Stage 1** - Click "Start" to fetch plugin metadata (2-4 hours)
2. **Stage 2** - Click "Start" to download latest versions (4-8 hours)
3. **Stage 3** - (Optional) Click "Start" to download all versions (24-48 hours)

All stages can be **paused** and **resumed** at any time.

## What You'll Get

- **~6000+ Atlassian Data Center plugins** with full metadata
- **Version history** for each plugin
- **Local JAR files** ready to download
- **Search** by name, vendor, or addon key
- **Filter** by Jira version (8, 9, 10, 11)

## Verify Installation

```bash
# Check all services are running
docker-compose ps

# View logs
docker-compose logs -f backend

# Test backend
curl http://localhost:3001/health
```

## Troubleshooting

### Services won't start?
```bash
docker-compose down
docker-compose up -d
docker-compose logs
```

### Need to restart?
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Want to reset everything?
```bash
docker-compose down -v  # WARNING: Deletes all data
docker-compose up -d
```

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Configure environment variables in `.env`
- Monitor sync progress in the Admin UI
- Browse and download plugins in the Plugins UI

## Support

Check logs first:
```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

For more help, see [README.md](README.md).
