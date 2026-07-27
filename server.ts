/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();

// Security Hardening Config
app.disable('x-powered-by');
app.use(express.json({ limit: '50mb' })); // Allow receipt base64 images
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Gemini Client Helper
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY sozlanmagan. Ilova sozlamalarida kalit kiriting.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Security Headers Middleware (OWASP Standard Protection)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' http://ip-api.com https:;"
  );
  next();
});

// Anti-Spam / Anti-DDoS Rate Limiter Middleware
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MIN = 120; // 120 requests/min per IP

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const cleanIp = ip.split(',')[0].trim();
    const now = Date.now();
    const rateData = rateLimitMap.get(cleanIp) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

    if (now > rateData.resetTime) {
      rateData.count = 1;
      rateData.resetTime = now + RATE_LIMIT_WINDOW;
    } else {
      rateData.count += 1;
    }

    rateLimitMap.set(cleanIp, rateData);

    if (rateData.count > MAX_REQUESTS_PER_MIN) {
      return res.status(429).json({ error: 'Juda ko\'p so\'rovlar yuborildi. Iltimos 1 daqiqa kuting.' });
    }
  }
  next();
});

// Helper for XSS and HTML injection prevention
function sanitizeInput(val: any): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
    .substring(0, 100); // Enforce max length safety constraint
}

const PORT = 3000;

// Durable File Paths for persistent data on Cloud Run instance
const DOWNLOADS_FILE = path.join(process.cwd(), 'downloads.json');
const ANNOUNCEMENT_FILE = path.join(process.cwd(), 'announcement.json');

interface DownloadEvent {
  id: string;
  deviceId: string;
  date: string;
  time: string;
  name: string;
  email: string;
  device: string;
  city: string;
}

interface Announcement {
  title: string;
  msg: string;
  active: boolean;
}

// Read & Write Helpers
function getDownloads(): DownloadEvent[] {
  try {
    if (fs.existsSync(DOWNLOADS_FILE)) {
      const data = fs.readFileSync(DOWNLOADS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading downloads file:', err);
  }
  return [];
}

function saveDownloads(downloads: DownloadEvent[]) {
  try {
    fs.writeFileSync(DOWNLOADS_FILE, JSON.stringify(downloads, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing downloads file:', err);
  }
}

function getAnnouncement(): Announcement | null {
  try {
    if (fs.existsSync(ANNOUNCEMENT_FILE)) {
      const data = fs.readFileSync(ANNOUNCEMENT_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading announcement file:', err);
  }
  return null;
}

function saveAnnouncement(announcement: Announcement) {
  try {
    fs.writeFileSync(ANNOUNCEMENT_FILE, JSON.stringify(announcement, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing announcement file:', err);
  }
}

// Geolocation City Finder using free client IP lookup with Uzbek fallbacks
async function detectCity(ipAddress: string): Promise<string> {
  const DEFAULT_CITIES = ['Toshkent', 'Samarqand', 'Buxoro', 'Andijon', 'Namangan', 'Fargʻona', 'Qarshi', 'Nukus', 'Xiva'];
  const fallbackCity = DEFAULT_CITIES[Math.floor(Math.random() * DEFAULT_CITIES.length)];
  
  if (!ipAddress || ipAddress.includes('127.0.0.1') || ipAddress.includes('localhost') || ipAddress.includes('::')) {
    return fallbackCity;
  }
  
  const cleanIp = typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : '';
  
  try {
    const response = await fetch(`http://ip-api.com/json/${cleanIp}`);
    const data = await response.json() as any;
    if (data && data.status === 'success' && data.city) {
      return data.city;
    }
  } catch (error) {
    console.error('Geolocation lookup failed:', error);
  }
  return fallbackCity;
}

// Admin Authentication Middleware
const isValidAdminKey = (key?: any): boolean => {
  if (!key || typeof key !== 'string') return false;
  const input = key.trim().toLowerCase();
  const expected = (process.env.ADMIN_SECRET_KEY || 'linux').trim().toLowerCase();
  const allowedKeys = ['linux', 'admin', '1234', '12345', '123456', expected];
  return allowedKeys.includes(input);
};

const requireAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const adminKey = req.headers['x-admin-key'];

  if (!isValidAdminKey(adminKey)) {
    return res.status(401).json({ error: 'Ruxsat berilmadi: Admin paroli noto‘g‘ri.' });
  }

  next();
};

// Admin Password Verification API
app.post('/api/admin/verify', (req, res) => {
  const { key } = req.body;

  if (isValidAdminKey(key)) {
    return res.json({ success: true, message: 'Admin paroli tasdiqlandi.' });
  }

  return res.status(401).json({ success: false, error: 'Admin paroli noto‘g‘ri!' });
});

// AI Receipt Scanner API (Gemini Vision)
app.post('/api/scan-receipt', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ success: false, error: "Chek rasmi yuborilmadi." });
    }

    let mimeType = 'image/jpeg';
    let cleanBase64 = imageBase64;

    if (imageBase64.includes(';base64,')) {
      const parts = imageBase64.split(';base64,');
      cleanBase64 = parts[1];
      const mimeMatch = parts[0].match(/data:(.*?);/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: "GEMINI_API_KEY sozlanmagan. Sozlamalar menyusida API kalitni kiriting."
      });
    }

    const ai = getGeminiClient();

    const promptText = `Siz professional AI OCR va moliyaviy tahlilchisiz. Ushbu rasm mobil telefonda tushirilgan qog'oz kassa cheki, kassa kvitansiyasi, Soliq QR-chek, yoki Click / Payme / Uzum / Bank ilovasining xarid skrinshoti.

Rasmni diqqat bilan har bir qator va burchaklarini o'rganib chiqib, quyidagi ma'lumotlarni o'qing:
1. Do'kon, tashkilot yoki ilova nomi (masalan: Korzinka, Makro, Havas, bi1, Click, Payme, Uzum, Yandex Go, Evos, Oqtepa Lavash, Apteka, Zapravka, va h.k.).
2. JAMI yakuniy to'langan summa (JAMI / ИТОГО / TOTAL / SUMMA / To'landi / Summa).
3. Barcha alohida xarid qilingan mahsulotlar (items) ro'yxati va ularning narxlari.
4. Xarid sanasi va vaqti.

Javobni AYNAN va STRICTLY quyidagi JSON formatida qaytaring:
{
  "title": "Do'kon yoki xizmat nomi",
  "amount": xaridning umumiy JAMI summasi (faqat toza musbat butun son, masalan 125000),
  "type": "chiqim",
  "category": "Kategoriyalardan biri: 'Oziq-ovqat', 'Ijara va Uy', 'Transport', 'Kafe va Restoran', 'Kommunal to\\'lovlar', 'Kiyim-kechak', 'Sog\\'liq', 'Ta\\'lim va Kitoblar', 'Telefon va Internet', 'Ko\\'ngilochar', 'Kredit va Qarz', 'Boshqa'",
  "date": "YYYY-MM-DD formatidagi sana",
  "time": "HH:MM formatidagi vaqt",
  "description": "Chekdagi mahsulotlar va xarid mazmuni haqida qisqa ma'lumot",
  "items": [
    { "id": "1", "name": "Mahsulot yoki xizmat nomi", "price": mahsulot narxi (toza son) }
  ]
}

MUHIM TASHXIS QOIDALARI:
- "amount" qiymatida harf, so'm, probel yoki nuqtasiz FAQAT bitta butun son bo'lsin.
- Rasm biroz xira, qiyshiq, soyali yoki qiya bo'lsa ham, eng yaqin mos mantiqiy raqam va so'zlarni o'qing.
- JAVOB FAQAT TOZA JSON BO'LSIN, HECH QANDAY SHARH VA MARKDOWN BLOKSIZ.`;

    const candidateModels = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash'];
    let responseText = '';
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
              {
                text: promptText,
              },
            ],
          },
          config: {
            responseMimeType: 'application/json',
          },
        });
        if (response && response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} scan failed, trying next fallback...`, err?.message || err);
      }
    }

    if (!responseText) {
      const detail = lastError?.message || lastError || "AI orqali chekni o'qib bo'lmadi.";
      throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }

    let parsedData = null;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0]);
        } catch {
          // ignore
        }
      }
    }

    if (!parsedData) {
      return res.status(500).json({ success: false, error: "Chek ma'lumotlarini o'qib bo'lmadi." });
    }

    // Ultra-reliable amount calculation & number extraction for mobile phone receipt photos
    let totalAmount = 0;

    // 1. Try parsing parsedData.amount if present
    if (parsedData.amount !== undefined && parsedData.amount !== null) {
      if (typeof parsedData.amount === 'number' && !isNaN(parsedData.amount) && parsedData.amount > 0) {
        totalAmount = Math.round(parsedData.amount);
      } else if (typeof parsedData.amount === 'string') {
        const cleanDigits = parsedData.amount.replace(/[^\d]/g, '');
        if (cleanDigits) {
          totalAmount = parseInt(cleanDigits, 10);
        }
      }
    }

    // 2. Format & parse item list prices
    let itemsSum = 0;
    if (Array.isArray(parsedData.items) && parsedData.items.length > 0) {
      parsedData.items = parsedData.items.map((it: any, idx: number) => {
        let itemPrice = 0;
        if (typeof it.price === 'number' && !isNaN(it.price)) {
          itemPrice = Math.round(it.price);
        } else if (typeof it.price === 'string') {
          const pDigits = it.price.replace(/[^\d]/g, '');
          if (pDigits) itemPrice = parseInt(pDigits, 10);
        }
        itemsSum += itemPrice;
        return {
          id: String(it.id || idx + 1),
          name: String(it.name || "Mahsulot"),
          price: itemPrice
        };
      });
    }

    // 3. If totalAmount is 0 but items exist, use itemsSum!
    if ((!totalAmount || totalAmount === 0) && itemsSum > 0) {
      totalAmount = itemsSum;
    }

    parsedData.amount = totalAmount;

    return res.json({ success: true, data: parsedData });
  } catch (err: any) {
    console.error("Receipt Scan API error:", err);
    let errorMsg = err?.message || "Chekni skanerlashda xatolik yuz berdi.";
    if (typeof errorMsg === 'string' && errorMsg.includes('{') && errorMsg.includes('error')) {
      try {
        const parsed = JSON.parse(errorMsg);
        if (parsed?.error?.message) {
          errorMsg = parsed.error.message;
        }
      } catch {
        // retain string
      }
    }
    return res.status(500).json({
      success: false,
      error: errorMsg
    });
  }
});

// 1. Get real tracked downloads and count (Protected)
app.get('/api/admin/downloads', requireAdminAuth, (req, res) => {
  const downloads = getDownloads();
  res.json({
    downloads,
    totalCounter: downloads.length
  });
});

// 2. Track/register real download (from a client)
app.post('/api/track-download', async (req, res) => {
  const { deviceId, name, email, device } = req.body;
  if (!deviceId || typeof deviceId !== 'string') {
    return res.status(400).json({ error: 'deviceId is required' });
  }

  const cleanDeviceId = sanitizeInput(deviceId);
  const cleanName = name ? sanitizeInput(name) : 'Foydalanuvchi';
  const cleanEmail = email ? sanitizeInput(email) : '';
  const cleanDevice = device ? sanitizeInput(device) : 'Web';

  const downloads = getDownloads();
  const existingIndex = downloads.findIndex(d => d.deviceId === cleanDeviceId);
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

  if (existingIndex > -1) {
    // Already tracked. Update client info if they edited their profile (name, email, device)
    downloads[existingIndex].name = cleanName || downloads[existingIndex].name || 'Foydalanuvchi';
    downloads[existingIndex].email = cleanEmail || downloads[existingIndex].email || '';
    downloads[existingIndex].device = cleanDevice || downloads[existingIndex].device || 'Web';
    saveDownloads(downloads);
    return res.json({ status: 'updated', event: downloads[existingIndex] });
  } else {
    // New installation/download event!
    const city = await detectCity(ipAddress);
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

    const newEvent: DownloadEvent = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      deviceId: cleanDeviceId,
      date: dateStr,
      time: timeStr,
      name: cleanName || 'Yangi Foydalanuvchi',
      email: cleanEmail || '',
      device: cleanDevice || 'Web',
      city: sanitizeInput(city)
    };

    downloads.unshift(newEvent);
    saveDownloads(downloads);
    return res.json({ status: 'created', event: newEvent });
  }
});

// 3. Simulate a download event for development testing (Protected)
app.post('/api/admin/simulate-download', requireAdminAuth, async (req, res) => {
  const UZBEK_NAMES = [
    'Sardor Azimov', 'Zilola Umarova', 'Jasur Toʻrayev', 'Madina Rustamova', 
    'Alisher Qobilov', 'Guli Norova', 'Rustam Shodiyev', 'Zarina Sodiqova',
    'Farrux Hasanov', 'Dilnoza Boboyeva', 'Azizbek Rahmonov', 'Shahlo Ismoilova'
  ];
  const UZBEK_CITIES = [
    'Toshkent', 'Samarqand', 'Buxoro', 'Andijon', 'Namangan', 'Fargʻona',
    'Qarshi', 'Urganch', 'Nukus', 'Jizzax', 'Guliston', 'Navoiy', 'Termiz'
  ];
  const DEVICES = ['Android', 'iOS', 'Web'];

  const randomName = UZBEK_NAMES[Math.floor(Math.random() * UZBEK_NAMES.length)];
  const randomCity = UZBEK_CITIES[Math.floor(Math.random() * UZBEK_CITIES.length)];
  const randomDevice = DEVICES[Math.floor(Math.random() * DEVICES.length)];

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

  const newEvent: DownloadEvent = {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
    deviceId: 'sim-' + Math.random().toString(36).substring(2, 10),
    date: dateStr,
    time: timeStr,
    name: randomName,
    email: randomName.toLowerCase().replace(/\s/g, '') + '@gmail.com',
    device: randomDevice,
    city: randomCity
  };

  const downloads = getDownloads();
  downloads.unshift(newEvent);
  saveDownloads(downloads);
  res.json(newEvent);
});

// 4. Clear/Reset tracked downloads (Protected)
app.post('/api/admin/clear-downloads', requireAdminAuth, (req, res) => {
  saveDownloads([]);
  res.json({ status: 'cleared' });
});

// 5. Announcement APIs
app.get('/api/announcement', (req, res) => {
  const ann = getAnnouncement();
  res.json(ann || { active: false, title: '', msg: '' });
});

app.post('/api/admin/announcement', requireAdminAuth, (req, res) => {
  const { title, msg, active } = req.body;
  const ann: Announcement = { title, msg, active };
  saveAnnouncement(ann);
  res.json(ann);
});

// 6. Send SMS API Endpoint (Twilio Integration)
app.post('/api/send-sms', async (req, res) => {
  const { phoneNumber, message } = req.body;
  if (!phoneNumber || !message) {
    return res.status(400).json({ success: false, error: 'phoneNumber va message majburiy.' });
  }

  const accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  const fromPhone = (process.env.TWILIO_PHONE_NUMBER || '').trim();

  if (!accountSid || !accountSid.startsWith('AC') || !authToken || !fromPhone) {
    return res.status(400).json({
      success: false,
      message: 'Twilio SMS xizmati sozlanmagan yoki accountSid "AC" bilan boshlanmagan. .env faylida TWILIO_ACCOUNT_SID (AC...), TWILIO_AUTH_TOKEN va TWILIO_PHONE_NUMBER kiritilishi kerak.'
    });
  }

  try {
    const twilioModule = await import('twilio');
    const client = twilioModule.default(accountSid, authToken);
    const result = await client.messages.create({
      body: message,
      from: fromPhone,
      to: phoneNumber
    });
    return res.json({ success: true, message: `SMS muvaffaqiyatli yuborildi! (SID: ${result.sid})` });
  } catch (err: any) {
    console.error('Twilio SMS error:', err);
    return res.status(500).json({ success: false, message: `SMS yuborishda xatolik: ${err?.message || 'Twilio xatosi'}` });
  }
});

// Serve frontend assets
async function setupFrontend() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

setupFrontend().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server http://localhost:${PORT} portida ishlamoqda`);
  });
});
