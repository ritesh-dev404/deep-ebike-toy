# DEEP E-BIKE & TOY - RETAIL SHOP MANAGEMENT SYSTEM

![DEEP E-BIKE & TOY POS](https://img.shields.io/badge/DEEP%20E--BIKE-POS%20PRO%20v1.0.0-orange?style=for-the-badge)
![Status](https://img.shields.io/badge/Production-Ready-emerald?style=for-the-badge)
![Offline](https://img.shields.io/badge/Offline--First-SQLite%20%2B%20Postgres-blue?style=for-the-badge)

A complete, production-grade **Retail Shop Management & POS System** custom-engineered for **DEEP E-BIKE & TOY** — specializing in Electric Bikes, Electric Scooters, Kids' Electric Ride-On Vehicles, Toys, Accessories, and Spare Parts.

---

## ⚡ Key Highlights & Architecture

* **Dual Platform**:
  - **Windows Desktop Application**: Powered by Electron, bundling local offline backend & printer bridges.
  - **Web-Based Owner Dashboard**: Responsive web portal for real-time remote revenue and inventory tracking.
* **Offline-First & Auto-Sync**:
  - Operates **100% offline** via local embedded SQLite database (`deep_pos.db`).
  - Seamless background synchronization to PostgreSQL cloud servers when connectivity is available.
  - Idempotent transaction queues prevent duplicate invoices and preserve audit integrity.
* **High-Speed POS Billing**:
  - Barcode scanning & quick-search with keyboard shortcut `F2`.
  - Inclusive GST and discount calculation with decimal precision.
  - Individual chassis/serial number assignment for electric vehicles.
  - Printable **80mm Thermal Receipts** and **A4 Tax Invoices** (with instant PDF export).
  - Cash, UPI (with QR code preview), Card, and Split payment reconciliation.
* **Strict Role-Based Security**:
  - **Owner**: Full access, profit analysis, stock valuation, supplier payables, employee management.
  - **Employee**: Streamlined POS billing, customer entry, permitted sales records. Confidential purchase prices and margins are stripped at the backend API level.
* **ACID Inventory Integrity**:
  - Stock deducted atomically during sale.
  - Negative inventory strictly prohibited.
  - Authorized bill cancellation with automatic stock restoration and serial number release.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend UI** | React 18, TypeScript, Tailwind CSS, Lucide React, Recharts |
| **Desktop Wrapper** | Electron, Electron Builder (Windows NSIS & Portable) |
| **Backend Engine** | Node.js, Express.js, TypeScript |
| **Databases** | Local: SQLite • Online: PostgreSQL |
| **ORM** | Prisma ORM (20 normalized tables) |
| **Security & Auth** | JWT, bcrypt password hashing, Role-based guards, Rate limiting, Helmet |
| **Document Engine** | PDFKit (A4 Tax Invoices), ExcelJS (Excel exports) |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **npm** v10+

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/deep-ebike-and-toy.git
cd "deep-ebike-and-toy"

# Install backend dependencies & setup database
cd server
npm install
npx prisma db push
npm run prisma:seed
cd ..

# Install frontend dependencies
cd client
npm install
cd ..

# Install desktop dependencies
cd electron
npm install
cd ..
```

### 3. Run Development Servers
```bash
# Terminal 1: Backend Server (Port 5000)
npm run dev:server

# Terminal 2: Frontend Client (Port 5173)
npm run dev:client
```
Visit `http://localhost:5173` or `http://localhost:5000` in your browser.

---

## 🔑 Default Demo Credentials

| Role | Username | Password | Permitted Access |
|---|---|---|---|
| **Store Owner** | `owner` | `Password@123` | Full access, Financials, Profit, Staff, Settings |
| **Sales Associate** | `employee` | `Password@123` | POS Billing, Product Search, Customer Entry |

*(Quick 1-click fill buttons are available directly on the login screen for instant testing!)*

---

## 📊 Business Modules Included

1. **Owner Executive Dashboard**:
   - Today's Sales, Monthly Revenue, Gross Profit, Total Stock Units, Inventory Valuation, Low Stock Alerts.
   - Interactive Recharts (14-day daily sales & profit trend, payment channel breakdown).
   - Recent POS transactions & Top-performing products.
2. **Smart POS Terminal**:
   - Barcode scanning & search.
   - 8 Store categories filter (*E-Bikes, E-Scooters, Kids Cars, Kids Bikes, RC Toys, Regular Toys, Accessories, Spare Parts*).
   - Live cart with quantity controls, serial selection, GST tax breakdown, change calculation.
   - 80mm thermal receipt & A4 invoice printing.
3. **Product & Chassis Catalog**:
   - Full product CRUD with model numbers, brands, barcodes, prices, and GST rates.
   - Individual chassis / serial number tracker.
   - Excel export.
4. **Stock & Movement Ledger**:
   - Complete audit trail of every stock increase/decrease with timestamps, before/after counts, and user IDs.
   - Manual stock adjustment modal with mandatory justification.
5. **Purchases & Suppliers**:
   - Supplier ledger with outstanding balances.
   - Stock-In purchase receipt recording with automatic stock increment.
6. **Customers CRM**:
   - Customer purchase histories, phone search, and lifetime spend volume.
7. **Sales Reports & Cancellation**:
   - Filterable sales ledger with Excel export.
   - Bill cancellation modal with automatic inventory restoration.
8. **Store Settings & 1-Click Backup**:
   - Shop profile configuration (Name, Address, Contact, GSTIN, Print format).
   - Instant local database backup snapshot creation and download.
9. **Diagnostics & Support**:
   - Hardware stats, database file size, process uptime, memory usage, security audit logs, and technical helpdesk contacts.

---

## 📦 Building Standalone Desktop Executable (.exe)

```bash
# 1. Build frontend and backend
npm run build

# 2. Build electron wrapper
cd electron
npm run build:electron

# 3. Create Windows NSIS Installer
npm run dist
```
The installer executable will be generated in `electron/release/`.

---

## 📄 Documentation Links
* [System Architecture & Database Design](docs/ARCHITECTURE.md)
* [User Manual & Operating Guide](docs/USER_MANUAL.md)
* [Database Backup & Restore Guide](docs/BACKUP_AND_RESTORE.md)
* [Production Deployment Guide](docs/DEPLOYMENT_GUIDE.md)

---

## 🏢 Business Information
* **Business Name**: DEEP E-BIKE & TOY
* **Category**: Electric Vehicles, Kids Ride-On & Toys Retail
* **Address**: Shop No. 12-14, Green Park Main Road, City Center
* **Contact**: +91 98765 43210 / +91 91234 56789
* **GSTIN**: 27ABCDE1234F1Z5
