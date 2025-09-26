const express = require('express');
const { createClient } = require('redis');

const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const COUNTER_KEY = 'clicks';

const app = express();

const client = createClient({
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT
  }
});

let redisConnected = false;

client.on('connect', () => {
  redisConnected = true;
  console.log('Connected to Redis');
});

client.on('end', () => {
  redisConnected = false;
  console.log('Disconnected from Redis');
});

client.on('error', (err) => {
  redisConnected = false;
  console.error('Redis error:', err);
});

client.connect().catch((err) => {
  redisConnected = false;
  console.error('Failed to connect to Redis:', err);
});

function checkRedis(req, res, next) {
  if (!redisConnected) {
    return res.status(500).json({ error: 'Redis connection error' });
  }
  next();
}

app.get('/redis-status', (req, res) => {
  res.json({ connected: redisConnected });
});

app.get('/count', checkRedis, async (req, res) => {
  try {
    const clicks = parseInt(await client.get(COUNTER_KEY)) || 0;
    res.json({ clicks });
  } catch (err) {
    res.status(500).json({ error: 'Redis error', details: err.message });
  }
});

app.post('/click', checkRedis, async (req, res) => {
  try {
    const clicks = await client.incr(COUNTER_KEY);
    res.json({ clicks });
  } catch (err) {
    res.status(500).json({ error: 'Redis error', details: err.message });
  }
});

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Clickster</title>
    <script>
      async function checkRedisOnLoad() {
        try {
          const res = await fetch('/redis-status');
          const data = await res.json();
          if (!data.connected) {
            showError('Unable to connect to Redis!');
            document.getElementById('clickBtn').disabled = true;
          } else {
            updateCount();
          }
        } catch (err) {
          showError('Network error or server unreachable');
        }
      }
      async function updateCount() {
        try {
          const res = await fetch('/count');
          const data = await res.json();
          if (!res.ok) {
            showError(data.error || 'Unable to connect to Redis!');
          } else {
            document.getElementById('count').textContent = data.clicks;
            hideError();
          }
        } catch (err) {
          showError('Network error or server unreachable');
        }
      }
      async function clickButton() {
        try {
          const res = await fetch('/click', { method: 'POST' });
          const data = await res.json();
          if (!res.ok) {
            showError(data.error || 'Unknown error');
          } else {
            document.getElementById('count').textContent = data.clicks;
            hideError();
          }
        } catch (err) {
          showError('Network error');
        }
      }
      function showError(msg) {
        document.getElementById('error').textContent = msg;
        document.getElementById('error').style.display = 'block';
        document.getElementById('counter').style.display = 'none';
      }
      function hideError() {
        document.getElementById('error').style.display = 'none';
        document.getElementById('counter').style.display = 'block';
      }
      window.onload = checkRedisOnLoad;
    </script>
    <style>
      #error {
        color: red;
        font-weight: bold;
        margin-top: 10px;
        display: none;
      }
    </style>
  </head>
  <body>
    <div id="error"></div>
    <div id="counter">
      <button id="clickBtn" onclick="clickButton()">
        <span id="count">?</span>
        <span>Clicks!</span>
      </button>
    </div>
  </body>
</html>
  `);
});

const server = app.listen(8080, () => {
  console.log('Server running on port 8080');
});

process.on('SIGINT', async () => {
  server.close(async () => {
    await client.quit();
    process.exit(0);
  });
});
