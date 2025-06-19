const express = require("express");
const router = express.Router();
const db = require("../db");

// Get all inventory items
router.get("/", async (req, res) => {
    try {
        const [items] = await db.query("SELECT * FROM inventory");
        res.json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching inventory." });
    }
});

// Sell an item
router.post("/sell/:id", async (req, res) => {
    const itemId = req.params.id;
    const paymentMethod = req.body.payment || "Cash"; // Optional: Allow frontend to send payment method

    try {
        const [rows] = await db.query("SELECT * FROM inventory WHERE id = ?", [itemId]);
        const item = rows[0];

        if (!item || item.stock <= 0) {
            return res.status(400).json({ message: "Item out of stock." });
        }

        await db.query("UPDATE inventory SET stock = stock - 1 WHERE id = ?", [itemId]);

        await db.query(
            "INSERT INTO finances (date, type, amount, category, payment, description) VALUES (NOW(), ?, ?, ?, ?, ?)",
            ["income", item.price, "Inventory", paymentMethod, `Sold: ${item.name}`]
        );

        res.json({ message: `Sold 1 unit of ${item.name}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error processing sale." });
    }
});

// Add new inventory item
router.post("/add", async (req, res) => {
    const { name, price, stock, category, logAsExpense, payment = "Cash" } = req.body;

    try {
        await db.query(
            "INSERT INTO inventory (name, price, stock, category) VALUES (?, ?, ?, ?)",
            [name, price, stock, category]
        );

        if (logAsExpense) {
            const totalCost = price * stock;
            await db.query(
                "INSERT INTO finances (date, type, amount, category, payment, description) VALUES (NOW(), ?, ?, ?, ?, ?)",
                ["expense", totalCost, "Inventory", payment, `Purchased: ${name} (${stock} units)`]
            );
        }

        res.status(201).json({ message: "Item added." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error adding item." });
    }
});

// Edit inventory item
router.put("/edit/:id", async (req, res) => {
    const itemId = req.params.id;
    const { name, price, stock, category } = req.body;

    try {
        await db.query(
            "UPDATE inventory SET name = ?, price = ?, stock = ?, category = ? WHERE id = ?",
            [name, price, stock, category, itemId]
        );
        res.json({ message: "Item updated successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error updating item." });
    }
});

module.exports = router;
