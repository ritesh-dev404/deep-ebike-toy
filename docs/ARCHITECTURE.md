# DEEP E-BIKE & TOY MANAGEMENT SYSTEM - SYSTEM ARCHITECTURE

## 1. High-Level Architecture Overview

The system is architected as an **Offline-First Hybrid Retail Management Platform** designed specifically for electric vehicles, ride-on cars, toys, and spare parts retail operations.

```
+-----------------------------------------------------------------------------------+
|                            WINDOWS DESKTOP APPLICATION                           |
|  +-------------------------------------+  +------------------------------------+  |
|  |       React POS Frontend (Vite)     |  |    Electron Main Process (IPC)     |  |
|  |  * Barcode Scanner listener         |  |  * 80mm ESC/POS Thermal Printing   |  |
|  |  * Offline Credential Cache         |  |  * A4 Tax Invoice PDF Generation   |  |
|  |  * Real-time Cart Math & Taxes      |  |  * Hardware & System Monitoring    |  |
|  +------------------+------------------+  +------------------+-----------------+  |
|                     |                                        |                    |
|                     v                                        v                    |
|  +-----------------------------------------------------------------------------+  |
|  |               Embedded Local Node.js / Express Backend Engine               |  |
|  |  * REST APIs (Billing, Stock, Catalog, Auth, Reports)                       |  |
|  |  * Decimal-Safe Monetary & GST Calculations                                 |  |
|  |  * Background Sync Worker (Polling every 30s)                               |  |
|  +------------------+----------------------------------------------------------+  |
|                     |                                                             |
|                     v                                                             |
|  +-----------------------------------------------------------------------------+  |
|  |               Local SQLite Database (prisma/deep_pos.db)                    |  |
|  |  * Atomic ACID Transactions ($transaction)                                  |  |
|  |  * Zero-Network Dependency for In-Store Sales                               |  |
|  +------------------+----------------------------------------------------------+  |
+---------------------|-------------------------------------------------------------+
                      |
                      | (Automatic Sync Queue Push/Pull via HTTPS)
                      v
+-----------------------------------------------------------------------------------+
|                            CENTRAL CLOUD PLATFORM                                 |
|  +-----------------------------------------------------------------------------+  |
|  |                    Cloud Node.js Backend REST Service                       |  |
|  +-------------------------------------+---------------------------------------+  |
|                                        |                                          |
|                                        v                                          |
|  +-----------------------------------------------------------------------------+  |
|  |             Online PostgreSQL Database (Enterprise Cloud DB)                |  |
|  +-------------------------------------+---------------------------------------+  |
|                                        |                                          |
|                                        v                                          |
|  +-----------------------------------------------------------------------------+  |
|  |               Web-Based Owner Dashboard (Mobile & Laptop Browser)           |  |
|  |  * Remote Live Revenue & Gross Profit Monitoring                            |  |
|  |  * Real-Time Stock & Low-Stock Alerts                                       |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Dual Database & Synchronization Design

### Local Database (SQLite)
* **File location**: `server/prisma/deep_pos.db`
* **Zero Configuration**: Embedded with the application, requires no external database server running on the store computer.
* **ACID Transactions**: Every sale, cancellation, stock inward, and adjustment runs inside `prisma.$transaction(...)` to guarantee that stock never becomes negative and bills are never duplicated.

### Central Cloud Database (PostgreSQL)
* Used for the Web Owner Dashboard when monitoring remotely from any device.
* Database provider can be toggled in `server/prisma/schema.prisma` (`provider = "postgresql"`).

### Synchronization Engine (`sync_queue` table)
Whenever an offline transaction occurs:
1. The sale, customer update, or stock change is committed to the local SQLite database.
2. An entry is atomically queued into `sync_queue`:
   - `entityName`: 'Sale' | 'Customer' | 'StockMovement' | 'Return'
   - `entityId`: Unique ID
   - `action`: 'CREATE' | 'UPDATE'
   - `payload`: Structured JSON payload
   - `status`: 'PENDING'
3. The background sync worker (`server/src/services/sync.service.ts`) runs periodically (default: every 30s) or on manual trigger.
4. When connectivity is restored, the worker batches pending records and transmits them to the cloud endpoint.
5. Invoices are strictly additive and immutable—each invoice carries a unique number (`INV-YYYY-XXXX`) and UUID, preventing collisions or data overwrites.

---

## 3. Database Schema (20 Normalized Tables)

1. **`roles`**: System roles (`OWNER`, `EMPLOYEE`).
2. **`permissions`**: Granular permissions across SALES, PRODUCTS, PURCHASES, STOCK, REPORTS, USERS, SETTINGS.
3. **`role_permissions`**: Many-to-many permission mapping.
4. **`users`**: Secure bcrypt password hashes, contact details, role references, and active flags.
5. **`categories`**: Product classifications (`Electric Bikes`, `Electric Scooters`, `Kids Electric Cars`, `Kids Electric Bikes`, `Electric Toys`, `Regular Toys`, `Accessories`, `Spare Parts`).
6. **`products`**: SKU, Barcode, Brand, Model, Selling Price, Purchase Cost, GST Rate, Current Stock, Min Stock Level, Serial Tracking flag.
7. **`product_serial_numbers`**: Individual chassis and serial numbers for electric vehicles (`AVAILABLE`, `SOLD`, `RETURNED`, `DEFECTIVE`).
8. **`suppliers`**: Vendor contacts, GST numbers, and outstanding balance tracking.
9. **`customers`**: CRM records, mobile numbers, address, and purchase volume.
10. **`purchases`**: Stock-In supplier invoices, payment status, tax, and grand totals.
11. **`purchase_items`**: Line items of incoming shipments with unit cost and attached chassis numbers.
12. **`sales`**: POS invoices with subtotal, GST, discounts, payment method (Cash, UPI, Card, Other), amount received, and change.
13. **`sale_items`**: Historical line items storing selling price AND historical purchase cost for lifetime gross profit accuracy.
14. **`payments`**: Reconciled payment logs.
15. **`stock_movements`**: Comprehensive inventory movement history (`PURCHASE`, `SALE`, `RETURN`, `ADJUSTMENT_ADD`, `ADJUSTMENT_SUB`) with before and after stock levels.
16. **`returns`**: Sales return and stock restoration logs.
17. **`expenses`**: Store overhead tracking (Rent, Electricity, Maintenance, Salaries).
18. **`audit_logs`**: Administrative activity audit logs (Logins, product price changes, manual stock adjustments).
19. **`sync_queue`**: Offline-to-online transaction synchronization queue.
20. **`application_settings`**: Store profile, invoice prefix, currency symbol, and backup metadata.
