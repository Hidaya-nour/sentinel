import { request } from 'undici';
import { connect } from 'node:tls';
import { URL } from 'node:url';

export interface CheckResult {
  success: boolean;
  statusCode?: number;
  latencyMs?: number;
  tlsExpiresAt?: Date;
  error?: string;
  finalUrl?: string;
}

export async function performCheck(url: string, expectedStatus: number): Promise<CheckResult> {
  const start = Date.now();
  try {
    const res = await request(url, {
      method: 'GET',
      headersTimeout: 10_000,
      bodyTimeout: 10_000,
      maxRedirections: 5, // follow up to 5 redirects, then treat further redirects as failure
    });
    const latencyMs = Date.now() - start;

    // Drain the body - undici keeps the connection open otherwise, leaking sockets
    // over many checks even though we don't care about the response body itself.
    await res.body.text();

    const success = res.statusCode === expectedStatus;
    const finalUrl =
      res.context && typeof res.context === 'object' && 'history' in res.context
        ? undefined // undici doesn't expose redirect history simply; skip for now
        : undefined;

    let tlsExpiresAt: Date | undefined;
    if (url.startsWith('https://')) {
      tlsExpiresAt = await getTlsExpiry(url).catch(() => undefined);
    }

    return {
      success,
      statusCode: res.statusCode,
      latencyMs,
      tlsExpiresAt,
      error: success ? undefined : `Expected status ${expectedStatus}, got ${res.statusCode}`,
    };
  } catch (err) {
    return {
      success: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

function getTlsExpiry(urlStr: string): Promise<Date> {
  const { hostname, port } = new URL(urlStr);
  return new Promise((resolve, reject) => {
    const socket = connect(
      { host: hostname, port: port ? Number(port) : 443, servername: hostname, timeout: 5000 },
      () => {
        const cert = socket.getPeerCertificate();
        socket.end();
        if (!cert || !cert.valid_to) {
          reject(new Error('No certificate found'));
          return;
        }
        resolve(new Date(cert.valid_to));
      },
    );
    socket.on('error', reject);
    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('TLS connection timed out'));
    });
  });
}
