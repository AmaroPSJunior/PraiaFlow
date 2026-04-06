import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { MercadoPagoConfig, Payment } from 'mercadopago';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}
const db = getFirestore(firebaseConfig.firestoreDatabaseId);

// Initialize Mercado Pago
console.log("Mercado Pago Access Token present:", !!process.env.MERCADO_PAGO_ACCESS_TOKEN);
const mpClient = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '' 
});
const payment = new Payment(mpClient);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/v1/config", (req, res) => {
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
    res.json({
      isTestMode: token.startsWith('TEST-') || !token,
    });
  });

  // Create PIX Payment
  app.post("/api/v1/payments/create", async (req, res) => {
    try {
      const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
      const appUrl = process.env.APP_URL;
      
      console.log("Mercado Pago Access Token check:", token ? `Present (starts with ${token.substring(0, 5)}...)` : "MISSING");
      console.log("APP_URL check:", appUrl || "MISSING");
      
      const { orderId, amount, email, description } = req.body;
      console.log("Payment request body:", { orderId, amount, email, description });

      // Validate amount is a positive number
      const numericAmount = Number(parseFloat(String(amount)).toFixed(2));
      if (isNaN(numericAmount) || numericAmount <= 0) {
        console.error("Invalid amount for Mercado Pago:", amount);
        return res.status(400).json({ error: "O valor total do pedido deve ser maior que zero." });
      }

      if (!token) {
        console.error("MERCADO_PAGO_ACCESS_TOKEN is missing");
        return res.status(500).json({ error: "Mercado Pago Access Token not configured in Secrets" });
      }

      // Initialize MP body
      const body = {
        transaction_amount: numericAmount,
        description: String(description || `Pedido #${orderId.slice(-6)}`).substring(0, 60),
        payment_method_id: 'pix',
        payer: {
          email: String(email || 'cliente@praiaflow.com'),
        },
        external_reference: String(orderId),
      };

      console.log("Sending request to Mercado Pago via SDK:", JSON.stringify(body, null, 2));

      const result = await payment.create({ 
        body
      });
      
      console.log("Mercado Pago Payment Created Successfully:", result.id);
      
      res.json({
        id: result.id,
        qr_code: result.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
        status: result.status,
      });
    } catch (error: any) {
      console.error("Error creating Mercado Pago payment:", error);
      
      // Handle SDK specific error structure
      const status = error.status || 500;
      const message = error.message || "Internal Server Error";
      const details = error.cause || error;

      res.status(status).json({ 
        error: message,
        details: details
      });
    }
  });

  // Mercado Pago Webhook
  app.post("/api/v1/payments/webhook", async (req, res) => {
    try {
      const { action, data } = req.body;
      console.log(`Mercado Pago Webhook received: ${action}`, data);

      if (action === 'payment.updated' && data?.id) {
        const paymentInfo = await payment.get({ id: data.id });
        const orderId = paymentInfo.external_reference;
        const status = paymentInfo.status;

        if (orderId && status === 'approved') {
          console.log(`Payment approved for order: ${orderId}`);
          await db.collection('orders').doc(orderId).update({
            status: 'paid',
            paymentStatus: 'paid',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      res.status(200).send('OK');
    } catch (error: any) {
      console.error("Error processing Mercado Pago webhook:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PraiaFlow server running on http://localhost:${PORT}`);
  });
}

startServer();
