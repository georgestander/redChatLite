import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { handlers } from '../api/src/lib/chat-system.js';

const PORT = Number.parseInt(process.env.DEMO_PORT ?? '8910', 10);

async function readBody(request: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function writeResponse(response: ServerResponse, body: string, status = 200, contentType = 'text/plain') {
  response.writeHead(status, { 'content-type': contentType });
  response.end(body);
}

async function pipeFetchResponse(fetchResponse: Response, nodeResponse: ServerResponse): Promise<void> {
  const headers: Record<string, string> = {};
  fetchResponse.headers.forEach((value, key) => {
    headers[key] = value;
  });
  nodeResponse.writeHead(fetchResponse.status, headers);

  if (!fetchResponse.body) {
    nodeResponse.end();
    return;
  }

  const reader = fetchResponse.body.getReader();
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) {
      break;
    }
    nodeResponse.write(Buffer.from(chunk.value));
  }
  nodeResponse.end();
}

function htmlPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>RedwoodChat Demo</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 24px; max-width: 860px; }
      .card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; }
      textarea { width: 100%; min-height: 80px; }
      button { margin-top: 8px; }
      pre { white-space: pre-wrap; background: #f6f6f6; padding: 12px; border-radius: 6px; min-height: 160px; }
      .meta { color: #666; font-size: 12px; }
    </style>
  </head>
  <body>
    <h1>RedwoodChat Local Demo</h1>
    <p class="meta">POST /api/chat stream rendered as it arrives.</p>

    <div class="card">
      <label for="prompt"><strong>Prompt</strong></label>
      <textarea id="prompt" placeholder="Ask anything..."></textarea>
      <br />
      <button id="send">Send</button>
    </div>

    <h2>Assistant Stream</h2>
    <pre id="output"></pre>

    <script>
      const output = document.getElementById('output');
      const send = document.getElementById('send');
      const prompt = document.getElementById('prompt');

      function append(text) {
        output.textContent += text;
      }

      async function streamPrompt(text) {
        output.textContent = '';

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id: 'demo-thread', prompt: text })
        });

        if (!response.ok || !response.body) {
          append('Request failed: ' + response.status);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const packets = buffer.split('\n\n');
          buffer = packets.pop() || '';

          for (const packet of packets) {
            const line = packet.split('\n').find((l) => l.startsWith('data:'));
            if (!line) continue;
            const json = line.slice(5).trim();
            if (json === '[DONE]') continue;
            try {
              const event = JSON.parse(json);
              if (event.type === 'text-delta' && event.delta) {
                append(event.delta);
              }
            } catch {
              // ignore non-json packets
            }
          }
        }
      }

      send.addEventListener('click', async () => {
        const text = prompt.value.trim();
        if (!text) return;
        await streamPrompt(text);
      });
    </script>
  </body>
</html>`;
}

const server = createServer(async (request, response) => {
  const method = request.method ?? 'GET';
  const url = new URL(request.url ?? '/', `http://localhost:${PORT}`);

  if (method === 'GET' && url.pathname === '/') {
    writeResponse(response, htmlPage(), 200, 'text/html; charset=utf-8');
    return;
  }

  if (method === 'POST' && url.pathname === '/api/chat') {
    const rawBody = await readBody(request);
    const payload = JSON.parse(rawBody.toString('utf8')) as {
      id?: string;
      prompt?: string;
      providerId?: string;
      model?: string;
    };

    const threadId = payload.id ?? `thread-${Date.now()}`;
    const messageId = `msg-${Date.now()}`;

    const chatRequest = new Request(`http://localhost:${PORT}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: threadId,
        sessionId: 'local-demo',
        providerId: payload.providerId,
        model: payload.model,
        message: {
          id: messageId,
          threadId,
          role: 'user',
          parts: [{ type: 'text', text: payload.prompt ?? '' }],
          createdAt: new Date().toISOString()
        }
      })
    });

    const fetchResponse = await handlers.chat(chatRequest);
    await pipeFetchResponse(fetchResponse, response);
    return;
  }

  const streamMatch = url.pathname.match(/^\/api\/chat\/([^/]+)\/stream$/);
  if (streamMatch && (method === 'GET' || method === 'POST')) {
    const fetchResponse = await handlers.stream(
      new Request(url.toString(), { method }),
      { id: streamMatch[1] }
    );
    await pipeFetchResponse(fetchResponse, response);
    return;
  }

  if (method === 'POST' && url.pathname === '/api/chat/attachments') {
    const rawBody = await readBody(request);
    const fetchResponse = await handlers.attachments(
      new Request(`http://localhost:${PORT}/api/chat/attachments`, {
        method: 'POST',
        headers: { 'content-type': request.headers['content-type'] ?? 'application/json' },
        body: rawBody
      })
    );
    await pipeFetchResponse(fetchResponse, response);
    return;
  }

  writeResponse(response, 'Not found', 404);
});

server.listen(PORT, () => {
  console.log(`redwood-demo running at http://localhost:${PORT}`);
});
