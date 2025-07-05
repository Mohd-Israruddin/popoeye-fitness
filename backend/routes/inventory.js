const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");

// Get all inventory items
router.get("/", async (req, res) => {
    try {
        const [items] = await db.query("SELECT * FROM inventory ORDER BY name");
        res.json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching inventory." });
    }
});

// Get best sellers analytics
router.get("/analytics", async (req, res) => {
    try {
        // Fetch low stock threshold from settings
        const [thresholdRows] = await db.query('SELECT low_stock_threshold FROM settings LIMIT 1');
        const lowStockThreshold = thresholdRows[0]?.low_stock_threshold || 5;

        // Get best sellers by quantity sold
        const [bestSellers] = await db.query(`
            SELECT 
                product_name,
                SUM(quantity) as total_sold,
                SUM(profit) as total_profit,
                AVG(selling_price) as avg_price
            FROM sales_tracking 
            GROUP BY product_name 
            ORDER BY total_sold DESC 
            LIMIT 5
        `);

        // Get low stock items using customizable threshold
        const [lowStockItems] = await db.query(`
            SELECT name, stock, dealer_contact 
            FROM inventory 
            WHERE stock < ? 
            ORDER BY stock ASC
        `, [lowStockThreshold]);

        // Get total sales statistics
        const [salesStats] = await db.query(`
            SELECT 
                COUNT(*) as total_sales,
                SUM(quantity) as total_items_sold,
                SUM(profit) as total_profit,
                AVG(profit) as avg_profit_per_sale
            FROM sales_tracking
        `);

        res.json({
            bestSellers,
            lowStockItems,
            lowStockThreshold,
            salesStats: salesStats[0] || { total_sales: 0, total_items_sold: 0, total_profit: 0, avg_profit_per_sale: 0 }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching analytics." });
    }
});

// Sell an item
router.post("/sell/:id", async (req, res) => {
    const itemId = req.params.id;
    const paymentMethod = req.body.payment || "Cash";

    try {
        const [rows] = await db.query("SELECT * FROM inventory WHERE id = ?", [itemId]);
        const item = rows[0];

        if (!item || item.stock <= 0) {
            return res.status(400).json({ message: "Item out of stock." });
        }

        // Calculate profit
        const profit = item.selling_price - item.cost_price;

        // Update inventory stock
        await db.query("UPDATE inventory SET stock = stock - 1 WHERE id = ?", [itemId]);

        // Log sale in sales_tracking table
        await db.query(`
            INSERT INTO sales_tracking (product_id, product_name, quantity, cost_price, selling_price, profit, payment_method) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [itemId, item.name, 1, item.cost_price, item.selling_price, profit, paymentMethod]);

        // Use selling_price for the income entry in finances
        await db.query(
            "INSERT INTO finances (date, type, amount, category, payment, description) VALUES (NOW(), ?, ?, ?, ?, ?)",
            ["income", item.selling_price, "Store Sale", paymentMethod, `Sold: ${item.name}`]
        );

        // Log activity (anonymous sale since no user code is provided)
        try {
            await db.query(
                'INSERT INTO activity_logs (action, target_type, target_id, details) VALUES (?, ?, ?, ?)',
                ['sell', 'inventory', itemId, `Sold inventory item: ${item.name} (1 unit, ₹${item.selling_price}, profit: ₹${profit})`]
            );
        } catch (logErr) {
            console.error('Failed to log sale activity:', logErr.message);
        }

        res.json({ 
            message: `Sold 1 unit of ${item.name}`,
            profit: profit,
            newStock: item.stock - 1
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error processing sale." });
    }
});

// Add new inventory item
router.post("/add", async (req, res) => {
    const { name, cost_price, selling_price, stock, category, dealer_contact, created_by } = req.body;

    // Basic validation - dealer_contact is optional
    if (!name || !cost_price || !selling_price || !stock || !category) {
        return res.status(400).json({ message: "Please provide all required fields (name, cost price, selling price, stock, category)." });
    }

    try {
        const [result] = await db.query(
            "INSERT INTO inventory (name, cost_price, selling_price, stock, category, dealer_contact, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [name, cost_price, selling_price, stock, category, dealer_contact || null, created_by || null]
        );
        
        // Log the purchase as an expense in finances
        const totalCost = cost_price * stock;
        await db.query(
            "INSERT INTO finances (date, type, amount, category, payment, description) VALUES (NOW(), ?, ?, ?, ?, ?)",
            ["expense", totalCost, "Inventory Purchase", "Cash", `Purchased: ${name} (${stock} units)`]
        );

        // Log activity if created_by is provided
        if (created_by) {
            await logActivity(created_by, 'add', 'inventory', result.insertId, `Added inventory item: ${name} (${stock} units, ₹${cost_price} cost, ₹${selling_price} selling)`);
        }

        res.status(201).json({ message: "Item added and purchase logged as expense." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error adding item." });
    }
});

// Edit inventory item
router.put("/edit/:id", async (req, res) => {
    const itemId = req.params.id;
    const { name, cost_price, selling_price, stock, category, dealer_contact, username, passkey } = req.body;

    if (!username || !passkey) {
        return res.status(403).json({ message: 'Admin passkey required.' });
    }
    const valid = await verifyAdminPasskey(username, passkey);
    if (!valid) {
        return res.status(403).json({ message: 'Invalid admin passkey.' });
    }

    try {
        await db.query(
            "UPDATE inventory SET name = ?, cost_price = ?, selling_price = ?, stock = ?, category = ?, dealer_contact = ?, updated_by = ? WHERE id = ?",
            [name, cost_price, selling_price, stock, category, dealer_contact, username, itemId]
        );
        
        // Log activity
        await logActivity(passkey, 'edit', 'inventory', itemId, `Updated inventory item: ${name} (${stock} units, ₹${cost_price} cost, ₹${selling_price} selling)`);
        
        res.json({ message: "Item updated successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error updating item." });
    }
});

// Add operational cost
router.post("/operational-cost", async (req, res) => {
    const { description, amount, category = "Operational Cost", payment_method = "Cash" } = req.body;

    if (!description || !amount) {
        return res.status(400).json({ message: "Description and amount are required." });
    }

    try {
        // Log as expense in finances table
        await db.query(
            "INSERT INTO finances (date, type, amount, category, payment, description) VALUES (NOW(), ?, ?, ?, ?, ?)",
            ["expense", amount, category, payment_method, `Store Operational Cost: ${description}`]
        );

        res.status(201).json({ message: "Operational cost logged successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error logging operational cost." });
    }
});

// Get operational costs summary
router.get("/operational-costs", async (req, res) => {
    try {
        const [costs] = await db.query(`
            SELECT 
                category,
                SUM(amount) as total_amount,
                COUNT(*) as transaction_count
            FROM finances 
            WHERE type = 'expense' 
            AND (category LIKE '%Operational%' OR category LIKE '%Transport%' OR category LIKE '%Packaging%')
            GROUP BY category
            ORDER BY total_amount DESC
        `);

        const [totalOperationalCost] = await db.query(`
            SELECT SUM(amount) as total
            FROM finances 
            WHERE type = 'expense' 
            AND (category LIKE '%Operational%' OR category LIKE '%Transport%' OR category LIKE '%Packaging%')
        `);

        res.json({
            costs,
            totalOperationalCost: totalOperationalCost[0]?.total || 0
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching operational costs." });
    }
});

// Helper to verify admin passkey
async function verifyAdminPasskey(username, passkey) {
    console.log('Verifying admin/staff code:', passkey);
    // Check for admin_code first
    const [adminRows] = await db.query('SELECT * FROM admin_settings WHERE admin_code = ?', [passkey]);
    console.log('Found admin records:', adminRows.length);
    
    if (adminRows.length > 0) {
        console.log('Admin code verified successfully');
        return true;
    }
    
    // Check for staff_code if admin_code not found
    const [staffRows] = await db.query('SELECT * FROM staff WHERE staff_code = ?', [passkey]);
    console.log('Found staff records:', staffRows.length);
    
    if (staffRows.length > 0) {
        console.log('Staff code verified successfully');
        return true;
    }
    
    console.log('No matching admin or staff code found');
    return false;
}

// Helper to log activity
async function logActivity(created_by, action, target_type, target_id, details) {
    try {
        // Find staff id by staff_code or admin_code
        let staffId = null, adminId = null;
        const [staffRows] = await db.query('SELECT id FROM staff WHERE staff_code = ?', [created_by]);
        if (staffRows.length > 0) {
            staffId = staffRows[0].id;
        } else {
            const [adminRows] = await db.query('SELECT id FROM admin_settings WHERE admin_code = ?', [created_by]);
            if (adminRows.length > 0) adminId = adminRows[0].id;
        }
        
        if (staffId) {
            await db.query(
                'INSERT INTO activity_logs (staff_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
                [staffId, action, target_type, target_id, details]
            );
        } else if (adminId) {
            await db.query(
                'INSERT INTO activity_logs (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
                [adminId, action, target_type, target_id, details]
            );
        } else {
            console.warn('Could not log activity: created_by not found in staff or admin_settings');
        }
    } catch (logErr) {
        console.error('Failed to log activity:', logErr.message);
    }
}

// POST alternative for delete (for clients that can't send body with DELETE)
router.post('/:id/delete', async (req, res) => {
    console.log('POST /inventory/:id/delete body:', req.body);
    const { created_by } = req.body;
    if (!created_by) {
        return res.status(403).json({ message: 'Admin/Staff ID required.' });
    }
    
    // Verify the admin/staff code exists
    try {
        const [adminRows] = await db.query('SELECT id FROM admin_settings WHERE admin_code = ?', [created_by]);
        const [staffRows] = await db.query('SELECT id FROM staff WHERE staff_code = ?', [created_by]);
        
        if (adminRows.length === 0 && staffRows.length === 0) {
            return res.status(403).json({ message: 'Invalid Admin/Staff ID.' });
        }
    } catch (verifyErr) {
        console.error('Error verifying admin/staff code:', verifyErr);
        return res.status(500).json({ message: 'Error verifying credentials.' });
    }
    
    try {
        // Get item details before deletion for logging
        const [itemRows] = await db.query("SELECT name, stock, cost_price, selling_price FROM inventory WHERE id = ?", [req.params.id]);
        const itemName = itemRows.length > 0 ? itemRows[0].name : 'Unknown';
        const itemStock = itemRows.length > 0 ? itemRows[0].stock : 0;
        const itemCost = itemRows.length > 0 ? itemRows[0].cost_price : 0;
        const itemSelling = itemRows.length > 0 ? itemRows[0].selling_price : 0;
        
        const [result] = await db.query('DELETE FROM inventory WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Item not found.' });
        }
        
        // Log activity
        await logActivity(created_by, 'delete', 'inventory', req.params.id, `Deleted inventory item: ${itemName} (${itemStock} units, ₹${itemCost} cost, ₹${itemSelling} selling)`);
        
        res.json({ message: 'Item deleted successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting item.' });
    }
});

// Update delete endpoint(s)
router.delete('/:id', async (req, res) => {
    console.log('DELETE /inventory/:id body:', req.body);
    const { created_by } = req.body;
    if (!created_by) {
        return res.status(403).json({ message: 'Admin/Staff ID required.' });
    }
    
    // Verify the admin/staff code exists
    try {
        const [adminRows] = await db.query('SELECT id FROM admin_settings WHERE admin_code = ?', [created_by]);
        const [staffRows] = await db.query('SELECT id FROM staff WHERE staff_code = ?', [created_by]);
        
        if (adminRows.length === 0 && staffRows.length === 0) {
            return res.status(403).json({ message: 'Invalid Admin/Staff ID.' });
        }
    } catch (verifyErr) {
        console.error('Error verifying admin/staff code:', verifyErr);
        return res.status(500).json({ message: 'Error verifying credentials.' });
    }
    
    try {
        // Get item details before deletion for logging
        const [itemRows] = await db.query("SELECT name, stock, cost_price, selling_price FROM inventory WHERE id = ?", [req.params.id]);
        const itemName = itemRows.length > 0 ? itemRows[0].name : 'Unknown';
        const itemStock = itemRows.length > 0 ? itemRows[0].stock : 0;
        const itemCost = itemRows.length > 0 ? itemRows[0].cost_price : 0;
        const itemSelling = itemRows.length > 0 ? itemRows[0].selling_price : 0;
        
        const [result] = await db.query('DELETE FROM inventory WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Item not found.' });
        }
        
        // Log activity
        await logActivity(created_by, 'delete', 'inventory', req.params.id, `Deleted inventory item: ${itemName} (${itemStock} units, ₹${itemCost} cost, ₹${itemSelling} selling)`);
        
        res.json({ message: 'Item deleted successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting item.' });
    }
});

module.exports = router;
