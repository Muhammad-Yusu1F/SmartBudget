/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const app = express();
app.use(express.json());

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

// 1. Get real tracked downloads and count
app.get('/api/admin/downloads', (req, res) => {
  const downloads = getDownloads();
  res.json({
    downloads,
    totalCounter: downloads.length
  });
});

// 2. Track/register real download (from a client)
app.post('/api/track-download', async (req, res) => {
  const { deviceId, name, email, device } = req.body;
  if (!deviceId) {
    return res.status(400).json({ error: 'deviceId is required' });
  }

  const downloads = getDownloads();
  const existingIndex = downloads.findIndex(d => d.deviceId === deviceId);
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

  if (existingIndex > -1) {
    // Already tracked. Update client info if they edited their profile (name, email, device)
    downloads[existingIndex].name = name || downloads[existingIndex].name || 'Foydalanuvchi';
    downloads[existingIndex].email = email || downloads[existingIndex].email || '';
    downloads[existingIndex].device = device || downloads[existingIndex].device || 'Web';
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
      deviceId,
      date: dateStr,
      time: timeStr,
      name: name || 'Yangi Foydalanuvchi',
      email: email || '',
      device: device || 'Web',
      city: city
    };

    downloads.unshift(newEvent);
    saveDownloads(downloads);
    return res.json({ status: 'created', event: newEvent });
  }
});

// 3. Simulate a download event for development testing
app.post('/api/admin/simulate-download', async (req, res) => {
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

// 4. Clear/Reset tracked downloads
app.post('/api/admin/clear-downloads', (req, res) => {
  saveDownloads([]);
  res.json({ status: 'cleared' });
});

// 5. Announcement APIs
app.get('/api/announcement', (req, res) => {
  const ann = getAnnouncement();
  res.json(ann || { active: false, title: '', msg: '' });
});

app.post('/api/admin/announcement', (req, res) => {
  const { title, msg, active } = req.body;
  const ann: Announcement = { title, msg, active };
  saveAnnouncement(ann);
  res.json(ann);
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
