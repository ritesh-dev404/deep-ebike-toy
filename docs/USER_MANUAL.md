# DEEP E-BIKE & TOY - USER MANUAL & OPERATING GUIDE

Welcome to the **DEEP E-BIKE & TOY** Retail Management & POS System. This guide provides comprehensive operational instructions for store owners and sales associates.

---

## 1. Login & Access Control

The system supports two distinct roles:

### Default Credentials:
* **Store Owner (Full Administrative Access)**:
  - **Username**: `owner`
  - **Password**: `Password@123`
* **Sales Associate (Billing & Permitted Records)**:
  - **Username**: `employee`
  - **Password**: `Password@123`

### Offline Login:
If the local store loses internet connection, sales associates can continue logging in. The system authenticates against local encrypted session caches so billing never stops.

---

## 2. Smart POS Billing (Sales Associates & Owner)

The POS terminal is built for speed and keyboard accessibility.

### Workflow:
1. **Focus Search**: Press `F2` on the keyboard to immediately focus the search bar.
2. **Scan / Search**:
   - Point your USB barcode scanner at the product barcode, or
   - Type the product name, SKU, or model number and press `Enter` to instantly add it to the bill.
3. **Select Chassis / Serial Number (For Electric Vehicles)**:
   - For Electric Bikes, Scooters, and Ride-On Cars, the serial dropdown will prompt you to select the unique chassis/serial number assigned to the unit being sold.
4. **Adjust Quantity & Discounts**:
   - Click `+` or `-` to adjust quantity.
   - The system prevents entering a quantity that exceeds current stock.
5. **Customer Details (Optional)**:
   - Enter customer's 10-digit mobile number.
   - If the customer is an existing regular, their name and lifetime purchase volume automatically display.
6. **Payment Method**:
   - Choose **Cash**, **UPI**, **Card**, or **Other**.
   - If **UPI** is selected, a dynamic QR code dialog displays for the customer to scan with any UPI app.
7. **Amount Received & Change**:
   - Enter the amount given by the customer.
   - The system calculates the exact change to return in real time.
8. **Generate Bill & Print**:
   - Click **Complete Sale & Print**.
   - The invoice dialog opens with two options:
     - **80mm Thermal Receipt**: Fast thermal roll print with store logo and terms.
     - **Standard A4 Invoice**: Full formal tax invoice with GST breakdown and authorized signature line.
     - **Download PDF**: Saves a copy to disk.

---

## 3. Product Catalog Management (Owner Only)

1. Navigate to **Product Catalog** in the sidebar.
2. Click **Add New Product**:
   - Select one of the 8 store categories (*Electric Bikes, Electric Scooters, Kids Cars, Kids Bikes, Electric Toys, Regular Toys, Accessories, Spare Parts*).
   - Enter Product Name, Brand, Model Number, and Barcode.
   - Enter **Purchase Price** (confidential to owner) and **Selling Price**.
   - Select GST Rate (5% for electric vehicles, 12% for regular toys, 18% for kids cars/batteries).
   - Check **Track individual chassis/serial numbers** if the product is an electric vehicle.
3. **Export to Excel**: Click **Export Excel** at the top right to download your entire product ledger.

---

## 4. Stock & Inventory Control (Owner Only)

* **Stock Overview**: View Available Units, Inventory Valuation (at purchase cost), Inward Purchases, and Outward Sales.
* **Low Stock Alerts**: Any product whose stock dips below its `minStockLevel` is highlighted with an alert banner.
* **Manual Stock Adjustment**:
  - If a unit is damaged or written off during physical count, click **Manual Stock Adjustment**.
  - Select the product, choose **Add Stock (+)** or **Deduct Stock (-)**, specify quantity, and enter a required reason.
* **Chassis & Serial Numbers Tracker**:
  - View all chassis numbers in inventory and verify which ones are `AVAILABLE`, `SOLD`, or `RETURNED`.

---

## 5. Inward Purchases & Suppliers (Owner Only)

Stock increases in the system **only** when a valid purchase receipt is saved.

1. Navigate to **Purchases & Suppliers**.
2. Click **Record Stock-In Purchase**:
   - Select the vendor/supplier.
   - Enter the supplier's Invoice Number and Date.
   - Add received items, received quantities, and unit purchase prices.
   - Enter the chassis numbers for received electric vehicles (one per line).
   - Click **Confirm Stock-In & Save**.
3. Inventory counts increase immediately, and a stock movement audit trail is recorded.

---

## 6. Sales Reports & Bill Cancellation

1. Navigate to **Sales & Invoices**.
2. Filter invoices by Date Range, Payment Method, or Status.
3. **Reprint Invoice**: Click the eye icon next to any bill to open the receipt viewer and print thermal or A4 formats.
4. **Cancel Invoice (Stock Restoration)**:
   - If a customer cancels an order or returns an item, click the **Cancel (RotateCcw)** icon.
   - Enter the mandatory cancellation reason.
   - The system restores product quantities, resets attached serial numbers to `AVAILABLE`, and flags the invoice as `CANCELLED`.
   - Invoices are never silently deleted to maintain strict accounting compliance.

---

## 7. Database Backups

1. Navigate to **Store Settings**.
2. Click **Create Local Backup Snapshot**:
   - An atomic snapshot of `deep_pos.db` with date and time stamp is generated in the `backups/` folder.
3. Click **Download Database File (.db)** to save a copy onto an external USB drive or cloud drive.
