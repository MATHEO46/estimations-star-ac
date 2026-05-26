const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const port = process.env.PORT || 4173;
const rootDir = __dirname;
const dataDir = process.env.DATA_DIR || path.join(rootDir, 'data');
const votesFile = path.join(dataDir, 'votes.json');
const rootWithSeparator = rootDir.endsWith(path.sep) ? rootDir : `${rootDir}${path.sep}`;

const candidates = [
  { name: 'Candidate A', color: '#f5c756' },
  { name: 'Candidate B', color: '#e75884' },
  { name: 'Candidate C', color: '#45c8d8' },
  { name: 'Candidate D', color: '#57d68d' },
  { name: 'Candidate E', color: '#b78cff' },
];

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

async function readVotes() {
  try {
    const file = await fs.readFile(votesFile, 'utf8');
    const saved = JSON.parse(file);
    return {
      votes: saved.votes || {},
      voters: saved.voters || {},
      ipVoters: saved.ipVoters || {},
    };
  } catch {
    return { votes: {}, voters: {}, ipVoters: {} };
  }
}

async function writeVotes(data) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(votesFile, JSON.stringify(data, null, 2));
}

function publicResults(data) {
  return candidates.map((candidate) => ({
    ...candidate,
    votes: data.votes[candidate.name] || 0,
  }));
}

function sendJson(response, status, payload) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 10000) {
        request.destroy();
        reject(new Error('Body too large'));
      }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function getVisitorHash(visitorId) {
  return crypto.createHash('sha256').update(String(visitorId)).digest('hex');
}

function getIpHash(request) {
  const forwarded = request.headers['x-forwarded-for'];
  const rawIp = Array.isArray(forwarded) ? forwarded[0] : String(forwarded || request.socket.remoteAddress || '');
  const ip = rawIp.split(',')[0].trim();
  return crypto.createHash('sha256').update(ip).digest('hex');
}

async function handleApi(request, response, url) {
  if (url.pathname === '/api/results' && request.method === 'GET') {
    const data = await readVotes();
    sendJson(response, 200, { candidates: publicResults(data) });
    return;
  }

  if (url.pathname === '/api/vote' && request.method === 'POST') {
    try {
      const body = JSON.parse(await readBody(request));
      const candidateName = String(body.candidate || '');
      const visitorId = String(body.visitorId || '');
      const candidate = candidates.find((item) => item.name === candidateName);

      if (!candidate || visitorId.length < 12) {
        sendJson(response, 400, { error: 'Vote invalide.' });
        return;
      }

      const data = await readVotes();
      const voterHash = getVisitorHash(visitorId);
      const ipHash = getIpHash(request);

      if (data.voters[voterHash] || data.ipVoters[ipHash]) {
        sendJson(response, 409, {
          error: 'Vous avez deja vote pour cette estimation.',
          candidates: publicResults(data),
        });
        return;
      }

      data.votes[candidate.name] = (data.votes[candidate.name] || 0) + 1;
      data.voters[voterHash] = {
        candidate: candidate.name,
        votedAt: new Date().toISOString(),
      };
      data.ipVoters[ipHash] = {
        candidate: candidate.name,
        votedAt: new Date().toISOString(),
      };
      await writeVotes(data);

      sendJson(response, 200, {
        ok: true,
        candidates: publicResults(data),
      });
    } catch {
      sendJson(response, 400, { error: 'Vote impossible pour le moment.' });
    }
    return;
  }

  sendJson(response, 404, { error: 'Introuvable.' });
}

async function serveStatic(response, url) {
  const safePath = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(rootDir, safePath));

  if (filePath !== rootDir && !filePath.startsWith(rootWithSeparator)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const extension = path.extname(filePath);
    const file = await fs.readFile(filePath);
    response.writeHead(200, { 'content-type': contentTypes[extension] || 'application/octet-stream' });
    response.end(file);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Page introuvable');
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname.startsWith('/api/')) {
    await handleApi(request, response, url);
    return;
  }

  await serveStatic(response, url);
});

server.listen(port, () => {
  console.log(`Site disponible sur http://127.0.0.1:${port}`);
});
