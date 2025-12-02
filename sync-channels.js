const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration from environment variables
const config = {
  apiUrl: process.env.VAR_API_URL,
  referer: process.env.VAR_REFERER,
  apiToken: process.env.VAR_API_TOKEN,
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  },
};

// Initialize Firebase Admin SDK
function initFirebase() {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: config.firebase.privateKey,
    }),
    databaseURL: config.firebase.databaseURL,
  });
  return admin.firestore();
}

// Fetch channels from API
function fetchChannels() {
  return new Promise((resolve, reject) => {
    const url = new URL(config.apiUrl);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Origin': config.referer,
        'Pragma': 'no-cache',
        'Referer': `${config.referer}/`,
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
        'authorization': `Bearer ${config.apiToken}`,
        'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Linux"',
        'x-app-name': 'niche-finder',
        'x-app-version': '0.1.0',
        'x-browser': 'Chrome',
        'x-browser-version': '142.0',
        'x-device-id': '7825b2f5970e907006ab4bfc637abb3e',
        'x-pixel-ratio': '1',
        'x-platform': 'Linux',
        'x-request-id': `getNewestChannels-${Date.now()}-${Math.random().toString(36).substring(2, 12)}`,
        'x-screen-resolution': '1920x1080',
        'x-timezone': 'Asia/Calcutta',
        'x-user-id': '6929cdb273adec38c8ca0bca',
        'x-viewport-size': '1920x966',
      },
    };

    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (error) {
          reject(new Error(`Failed to parse API response: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Remove lastUploadedVideos from channel data
function cleanChannelData(channel) {
  const { lastUploadedVideos, ...cleanedChannel } = channel;
  return cleanedChannel;
}

// Push channels to Firebase
async function pushToFirebase(db, channels) {
  const BATCH_SIZE = 500;
  let totalCount = 0;
  const fetchedAt = new Date().toISOString();

  for (let i = 0; i < channels.length; i += BATCH_SIZE) {
    const chunk = channels.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const channel of chunk) {
      const channelId = channel.id || channel._id || channel.channelId;

      if (!channelId) {
        console.warn('Channel without ID found, skipping');
        continue;
      }

      const docRef = db.collection('channels').doc(String(channelId));
      const channelData = {
        ...cleanChannelData(channel),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        fetchedAt: fetchedAt,
      };

      batch.set(docRef, channelData, { merge: true });
      totalCount++;
    }

    await batch.commit();
    console.log(`Committed batch ${Math.floor(i / BATCH_SIZE) + 1} (${chunk.length} documents)`);
  }

  return totalCount;
}

// Main execution
async function main() {
  console.log('Starting channel sync...\n');

  // Validate configuration
  if (!config.apiUrl || !config.apiToken) {
    console.error('Error: Missing API configuration (VAR_API_URL, VAR_API_TOKEN)');
    process.exit(1);
  }

  if (!config.firebase.projectId || !config.firebase.clientEmail || !config.firebase.privateKey) {
    console.error('Error: Missing Firebase configuration');
    process.exit(1);
  }

  try {
    // Step 1: Fetch channels from API
    console.log('Fetching channels from API...');
    const data = await fetchChannels();

    // Handle both array and object with data property
    const channels = Array.isArray(data) ? data : (data.data || data.channels || []);

    if (!Array.isArray(channels) || channels.length === 0) {
      console.log('No channels found in API response');
      process.exit(0);
    }

    console.log(`Fetched ${channels.length} channels from API\n`);

    // Step 2: Initialize Firebase and push data
    console.log('Initializing Firebase...');
    const db = initFirebase();

    console.log('Pushing data to Firebase...');
    const totalCount = await pushToFirebase(db, channels);

    // Summary
    console.log('\n=== Summary ===');
    console.log(`Total channels processed: ${totalCount}`);
    console.log(`Batches committed: ${Math.ceil(channels.length / 500)}`);
    console.log('Sync completed successfully!');

  } catch (error) {
    console.error('Error during sync:', error.message);
    process.exit(1);
  }
}

main();
