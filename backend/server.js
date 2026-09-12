const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;
const frontendDir = path.join(__dirname, "../frontend");
const uploadDir = process.env.VERCEL ? "/tmp/uploads" : path.join(frontendDir, "uploads");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, "-");
    cb(null, `${timestamp}-${safeName}`);
  },
});

const upload = multer({ storage });

const orders = [];
const products = [
  {
    id: "prod-1",
    name: "Royal Silk Saree",
    code: "AS-101",
    price: 3499,
    image: "hero_img.webp",
    description: "A premium silk saree with rich texture and elegant drape.",
  },
  {
    id: "prod-2",
    name: "Pink Festive Saree",
    code: "AS-102",
    price: 2799,
    image: "hero_img.webp",
    description: "Soft pastel tones designed for festive celebrations.",
  },
  {
    id: "prod-3",
    name: "Golden Embroidered Saree",
    code: "AS-103",
    price: 3899,
    image: "hero_img.webp",
    description: "Intricate embroidery paired with a luxurious golden finish.",
  },
  {
    id: "prod-4",
    name: "Classic Black Saree",
    code: "AS-104",
    price: 3299,
    image: "hero_img.webp",
    description: "Timeless black elegance for evening events and weddings.",
  },
];

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use((req, res, next) => {
  const blockedPaths = ["/backend", "/backend/", "/server.js", "/package.json", "/backend/server.js", "/backend/package.json"];

  if (blockedPaths.includes(req.path) || req.path.startsWith("/backend/")) {
    return res.status(404).json({ message: "Not found." });
  }

  next();
});

app.use(express.static(frontendDir));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Adiyta Saree API is running",
    totalOrders: orders.length,
  });
});

app.get("/api/orders", (req, res) => {
  res.json(orders);
});

app.patch("/api/orders/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowedStatuses = ["new", "on hold", "confirmed", "delivered"];

  const orderIndex = orders.findIndex((order) => order.id === id);

  if (orderIndex === -1) {
    return res.status(404).json({ message: "Order not found." });
  }

  const nextStatus = allowedStatuses.includes(status) ? status : "new";
  orders[orderIndex].status = nextStatus;

  res.json({
    message: "Order status updated successfully.",
    order: orders[orderIndex],
  });
});

app.delete("/api/orders/:id", (req, res) => {
  const { id } = req.params;
  const orderIndex = orders.findIndex((order) => order.id === id);

  if (orderIndex === -1) {
    return res.status(404).json({ message: "Order not found." });
  }

  const [deletedOrder] = orders.splice(orderIndex, 1);

  res.json({
    message: "Order deleted successfully.",
    order: deletedOrder,
  });
});

app.post("/api/orders", (req, res) => {
  const { name, phone, saree, quantity, address, deliveryType, deliveryFee } = req.body;

  if (!name || !phone || !saree || !address) {
    return res.status(400).json({
      message: "Please fill in all required fields.",
    });
  }

  const newOrder = {
    id: String(Date.now()),
    name,
    phone,
    saree,
    quantity: Number(quantity) || 1,
    address,
    deliveryType: deliveryType || "insideDhaka",
    deliveryFee: Number(deliveryFee) || 0,
    status: "new",
    createdAt: new Date().toISOString(),
  };

  orders.unshift(newOrder);

  res.status(201).json({
    message: "অর্ডারটি পাঠানো হয়েছে। আমাদের দল শীঘ্রই আপনার সাথে যোগাযোগ করবে।",
    order: newOrder,
  });
});

app.get("/api/products", (req, res) => {
  res.json(products);
});

app.post("/api/products", upload.single("imageFile"), (req, res) => {
  const { name, code, price, image, description } = req.body;

  if (!name || !code || !price) {
    return res.status(400).json({
      message: "Product name, code, and price are required.",
    });
  }

  const uploadedImage = req.file ? `/uploads/${req.file.filename}` : image || "hero_img.webp";

  const newProduct = {
    id: `prod-${Date.now()}`,
    name,
    code,
    price: Number(price) || 0,
    image: uploadedImage,
    description: description || "",
  };

  products.push(newProduct);

  res.status(201).json({
    message: "Product added successfully.",
    product: newProduct,
  });
});

app.patch("/api/products/:id", upload.single("imageFile"), (req, res) => {
  const { id } = req.params;
  const { name, code, price, image, description } = req.body;
  const productIndex = products.findIndex((product) => product.id === id);

  if (productIndex === -1) {
    return res.status(404).json({ message: "Product not found." });
  }

  const uploadedImage = req.file ? `/uploads/${req.file.filename}` : image || products[productIndex].image;

  products[productIndex] = {
    ...products[productIndex],
    name: name || products[productIndex].name,
    code: code || products[productIndex].code,
    price: Number(price) || products[productIndex].price,
    image: uploadedImage,
    description: description ?? products[productIndex].description,
  };

  res.json({
    message: "Product updated successfully.",
    product: products[productIndex],
  });
});

app.patch("/api/products/:id/move", (req, res) => {
  const { id } = req.params;
  const { direction } = req.body;
  const productIndex = products.findIndex((product) => product.id === id);

  if (productIndex === -1) {
    return res.status(404).json({ message: "Product not found." });
  }

  const targetIndex = direction === "up" ? productIndex - 1 : productIndex + 1;

  if (targetIndex < 0 || targetIndex >= products.length) {
    return res.status(400).json({ message: "Cannot move product further in that direction." });
  }

  [products[productIndex], products[targetIndex]] = [products[targetIndex], products[productIndex]];

  res.json({
    message: "Product order updated successfully.",
    products,
  });
});

app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const productIndex = products.findIndex((product) => product.id === id);

  if (productIndex === -1) {
    return res.status(404).json({ message: "Product not found." });
  }

  const [deletedProduct] = products.splice(productIndex, 1);

  res.json({
    message: "Product deleted successfully.",
    product: deletedProduct,
  });
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(frontendDir, "admin.html"));
});

app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ message: "API route not found." });
  }

  res.sendFile(path.join(frontendDir, "index.html"));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Adiyta Saree server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
