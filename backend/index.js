import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import axios from 'axios';
import { createClient } from 'redis';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Changed Port to 5001 to avoid conflicts
const PORT = process.env.PORT || 5001;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

let isRedisConnected = false;
let globalProcessedCount = 142050;

redisClient.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
        // Suppress logs
    }
});

async function connectRedis() {
    try {
        await redisClient.connect();
        isRedisConnected = true;
        console.log("Connected to Redis");
    } catch (e) {
        // Fallback
    }
}
connectRedis();

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Fix for Form Data
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// --- REAL-TIME DATA GENERATOR DISABLED (User Request) ---
// Only Real SMS/Clipboard events will appear now.
/*
setInterval(() => {
   const mockTx = generateMockTransaction();
   io.emit('fraud-alert', mockTx);
   globalProcessedCount++;
}, 2500);
*/

function generateMockTransaction() {
    const types = ['Network_Live', 'SMS_Interceptor', 'API_Gateway'];
    const type = types[Math.floor(Math.random() * types.length)];

    // Realistic Indian Context Data
    const senders = ['rahul.verma@okicici', 'kirana_store@paytm', '+91-98765xxxxx', 'sbi_alert@fake', 'anjali_s@ybl', 'unknown@axis'];
    const scams = [
        'Dear user, your SBI YONO account will be blocked today. Click link to update KYC.',
        'Congrats! You won Rs.2000 cashback on GooglePay. Claim now.',
        'Urgent: Electricity bill unpaid. Power will be cut tonight. Pay immediately at...',
        'Credit Card Points expiring today. Redeem for cash here.',
        'Part-time job offer: Earn 5000/day. WhatsApp us at...'
    ];
    const safe = ['Paid Rs.450 for Grocery', 'Received Rs.2000 from Dad', 'Bill payment successful', 'UPI Transfer to 9876xxxxxx'];

    // 30% Chance of Scam
    const isScam = Math.random() < 0.3;
    const content = isScam ? scams[Math.floor(Math.random() * scams.length)] : safe[Math.floor(Math.random() * safe.length)];
    const sender = isScam && type === 'SMS_Interceptor' ? '+91-99' + Math.floor(10000000 + Math.random() * 90000000) : senders[Math.floor(Math.random() * senders.length)];

    return {
        id: Date.now() + Math.random(),
        type: type === 'SMS_Interceptor' ? 'SMS' : 'Transaction',
        content: content,
        sender: sender,
        risk: isScam ? 0.85 : 0.02,
        triggers: isScam ? ['Linguistic_Fraud', 'Pattern_Match'] : [],
        timestamp: new Date().toISOString(),
        isGlobal: true, // Simulated Stream
        isEdge: type === 'SMS_Interceptor' // Mark SMS as "Phone Detected"
    };
}

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
});

// SMART SMS HANDLER (Robust + Intelligent)
app.all('/api/ingest/sms', async (req, res) => {
    try {
        console.log("--- INCOMING SMS ---");
        // 1. ROBUST EXTRACTION (Crash Proof)
        const body = req.body || {};
        const query = req.query || {};

        let msg = body.message || query.message || body.msg || query.msg || body.text || query.text || body.content || query.content;
        let from = body.sender || query.sender || body.from || query.from || body.address || query.address || "Unknown";

        // Fallback: Dump Body if message empty
        if (!msg) {
            try { msg = JSON.stringify(body); } catch (e) { msg = ""; }
        }

        // Ensure String
        const message = String(msg || "");
        const sender = String(from || "Unknown");
        console.log(`Processing: ${sender} - ${message.substring(0, 30)}...`);

        // 2. LOGIC: FRAUD DETECTION ENGINE
        let risk = 0.05; // Base Risk
        let triggers = [];

        // A. Linguistic Analysis
        const lowerMsg = message.toLowerCase();
        const scamWords = ['lottery', 'winner', 'kyc', 'blocked', 'urgent', 'expire', 'refund', 'cbi', 'police', 'otp', 'cashback', 'unpaid', 'credit points', 'job offer', 'earn', 'part-time', 'yono', 'sbin', 'hdfc'];

        if (scamWords.some(w => lowerMsg.includes(w))) {
            risk += 0.45;
            triggers.push('Linguistic_Fraud');
        }

        // B. Link Detection
        if (/(http|https|www)\:\/\/[^\s]+/.test(message)) {
            risk += 0.25;
            triggers.push('Suspicious_Link');
        }

        // C. Urgency Detection
        if (lowerMsg.includes('immediate') || lowerMsg.includes('24 hours') || lowerMsg.includes('today') || lowerMsg.includes('tonight')) {
            risk += 0.15;
            triggers.push('Urgency_Tactic');
        }

        // D. Pattern Matching (Numbers)
        if (/\+91[ -]?\d{10}/.test(message) || /\d{10}/.test(message)) {
            // Mention of phone numbers in body often implies "Call us at..."
            if (risk > 0.3) risk += 0.1;
        }

        // 3. GRAPH CHECK (Redis Mock)
        // If sender is unknown/suspicious node
        if (isRedisConnected) {
            // In real app: await redisClient.sIsMember('fraud_nodes', sender);
            // We skip for demo stability
        }

        const isHighRisk = risk > 0.6;

        // 3. EMIT TO DASHBOARD
        const payload = {
            id: Date.now(),
            type: 'SMS',
            content: message,
            sender: sender,
            risk: Math.min(risk, 0.99),
            triggers: triggers.length > 0 ? triggers : ['Manual_Bridge'],
            timestamp: new Date().toISOString(),
            isGlobal: false // Shows in User Alert Feed
        };

        io.emit('fraud-alert', payload);

        console.log(`Risk Score: ${risk.toFixed(2)} | Triggers: ${triggers.join(',')}`);

        // 4. RESPONSE
        return res.json({ status: 'PROCESSED', risk: risk, flags: triggers });

    } catch (error) {
        console.error("HANDLER ERROR:", error);
        // Fallback Success response
        return res.json({ status: 'SAVED_W_ERROR' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', port: PORT });
});

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend running on ${PORT}`);
});
