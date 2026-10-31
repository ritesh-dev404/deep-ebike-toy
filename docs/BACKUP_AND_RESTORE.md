# DATABASE BACKUP AND RESTORATION GUIDE

This document explains backup strategies, automated retention, and restoration procedures for both the local offline SQLite database and the cloud PostgreSQL database.

---

## 1. Local SQLite Database (`deep_pos.db`)

### File Location:
* Development/Desktop: `server/prisma/deep_pos.db`
* Automated Backups: `server/backups/deep_pos_backup_YYYY-MM-DDTHH-mm-ss.db`

### Creating a Manual Backup via UI:
1. Log in as **Store Owner**.
2. Go to **Store Settings** in the sidebar.
3. Under **Database Backup & Security**, click **Create Local Backup Snapshot**.
4. To archive off-device, click **Download Database File (.db)** and save to a secure flash drive.

### Creating a Manual Backup via PowerShell:
```powershell
# Copy database file with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
Copy-Item "server\prisma\deep_pos.db" -Destination "server\backups\deep_pos_backup_$timestamp.db"
```

### Restoring from an SQLite Backup:
1. Stop the POS application or server process:
   ```powershell
   Get-Process -Name node, electron -ErrorAction SilentlyContinue | Stop-Process -Force
   ```
2. Locate the backup file in `server/backups/`.
3. Copy the backup file over the active database file:
   ```powershell
   Copy-Item "server\backups\deep_pos_backup_YYYY-MM-DD_HH-mm-ss.db" -Destination "server\prisma\deep_pos.db" -Force
   ```
4. Restart the application. All restored sales, products, and customer records will be immediately live.

---

## 2. Cloud PostgreSQL Database (Online Mode)

When running the system connected to a PostgreSQL database (`DATABASE_URL="postgresql://user:password@host:5432/deep_pos_db"`):

### Creating a Backup (pg_dump):
```bash
pg_dump -U postgres -h localhost -d deep_pos_db -F c -b -v -f "deep_pos_backup_$(date +%Y%m%d_%H%M%S).dump"
```

### Restoring from a Backup (pg_restore):
```bash
pg_restore -U postgres -h localhost -d deep_pos_db -v -c "deep_pos_backup_TIMESTAMP.dump"
```

---

## 3. Disaster Recovery Best Practices
1. **Daily USB Export**: Store owners should download a `.db` backup file at the end of each business day onto a dedicated USB flash drive.
2. **Sync Verification**: Check the top navigation bar to ensure the pending sync count is `0`, indicating all transactions have safely synchronized with the cloud backend.
3. **Database Integrity Check**: Use `sqlite3` or Prisma Studio to inspect table counts:
   ```bash
   cd server
   npx prisma studio
   ```
