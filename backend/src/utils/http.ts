import { ServerResponse, IncomingMessage } from 'node:http';

export function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify(data));
}

export function sendSuccess(res: ServerResponse, data: any = {}, message?: string, statusCode: number = 200) {
  sendJson(res, statusCode, {
    success: true,
    ...(message ? { message } : {}),
    ...(typeof data === 'object' && data !== null && !Array.isArray(data) ? data : { data }),
  });
}

export function sendError(res: ServerResponse, statusCode: number, message: string, errors?: any) {
  sendJson(res, statusCode, {
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
}

export async function parseJsonBody<T = any>(req: IncomingMessage, maxBytes: number = 10 * 1024 * 1024): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = '';
    let bytesReceived = 0;

    req.on('data', (chunk) => {
      bytesReceived += chunk.length;
      if (bytesReceived > maxBytes) {
        reject(new Error(`Payload too large. Exceeds limit of ${maxBytes} bytes.`));
        req.destroy();
        return;
      }
      body += chunk;
    });

    req.on('end', () => {
      if (!body.trim()) {
        resolve({} as T);
        return;
      }
      try {
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (err: any) {
        reject(new Error(`Invalid JSON in request body: ${err.message}`));
      }
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}
