# PRODUCTION DEPLOYMENT & WINDOWS INSTALLER GUIDE

This guide provides instructions for building the standalone Windows desktop installer and deploying the cloud-based web application.

---

## 1. Windows Desktop Application Packaging (.exe)

The application uses `electron-builder` to produce both an NSIS Windows installer (`.exe`) and a standalone portable `.exe`.

### Prerequisites
* Node.js v18+ or v20+ (v24 supported)
* Windows 10 / 11 64-bit

### Packaging Steps
1. Build both client and server:
   ```bash
   # From root:
   npm run build
   ```
2. Build Electron TypeScript:
   ```bash
   cd electron
   npm run build:electron
   ```
3. Generate the Windows installer:
   ```bash
   npm run dist
   ```
   * The generated installer is output to:
     `electron/release/DEEP E-BIKE & TOY POS-Setup-1.0.0.exe`
4. The installer creates:
   - Start Menu shortcut
   - Desktop icon: `DEEP E-BIKE POS`
   - Uninstaller in Windows Settings / Control Panel

---

## 2. Cloud Web Platform Deployment (Owner Web Dashboard)

For hosting the central cloud web dashboard (accessible from phone/laptop anywhere):

### Environment Variables
Configure the following environment variables on your cloud server (Docker, Render, AWS, Railway, VPS):
```env
PORT=5000
NODE_ENV=production
DATABASE_URL="postgresql://postgres:SecurePassword123@your-db-host:5432/deep_pos_db?schema=public"
JWT_SECRET="deep_ebike_toy_jwt_secret_secure_key_2026_retail_pro"
JWT_EXPIRES_IN=7d
AUTO_SYNC_ENABLED=true
SYNC_INTERVAL_SECONDS=30
```

### PostgreSQL Setup
1. Switch datasource provider in `server/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Run database migration and seeding:
   ```bash
   cd server
   npx prisma db push
   npx prisma db seed
   ```

### Docker Deployment (Optional Dockerfile)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN cd server && npm install && npm run build
RUN cd client && npm install && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/server /app/server
COPY --from=builder /app/client/dist /app/client/dist
EXPOSE 5000
WORKDIR /app/server
CMD ["node", "dist/server.js"]
```

---

## 3. Production Operational Checklist
- [x] Run `npm run prisma:seed` to initialize default catalog and roles.
- [x] Test barcode scanner by scanning product barcodes on the POS terminal.
- [x] Verify receipt print layout on 80mm thermal paper.
- [x] Verify that employees cannot view confidential purchase cost prices.
- [x] Confirm that stock movements audit trail logs every transaction.
- [x] Verify that cancelling an invoice automatically restores product inventory and chassis numbers.
- [x] Test offline operation by disconnecting internet—sales continue without interruption.
