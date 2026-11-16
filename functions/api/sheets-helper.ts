export interface Env {
  SPREADSHEET_ID?: string;
  GEMINI_API_KEY?: string;
  GOOGLE_SCRIPT_URL?: string;
  GOOGLE_SERVICE_ACCOUNT_EMAIL?: string;
  GOOGLE_PRIVATE_KEY?: string;
}

export const DEFAULT_SPREADSHEET_ID = '1VvS_1QHdbXDEDM1Zju4FcrWriLfeaZwuqBdp9HIMi-U';

// Base64Url encoder
function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Convert PEM to ArrayBuffer for WebCrypto
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN[A-Z ]+-----/g, '')
    .replace(/-----END[A-Z ]+-----/g, '')
    .replace(/\\n/g, '')
    .replace(/\s+/g, '');
  const raw = atob(b64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    buf[i] = raw.charCodeAt(i);
  }
  return buf.buffer;
}

// Get Google OAuth 2.0 Access Token from Service Account using WebCrypto
export async function getGoogleAccessToken(email: string, privateKeyPem: string): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaim = base64UrlEncode(JSON.stringify(claim));
  const dataToSign = new TextEncoder().encode(`${encodedHeader}.${encodedClaim}`);

  const keyBuffer = pemToArrayBuffer(privateKeyPem);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, dataToSign);
  const signatureBytes = new Uint8Array(signature);
  let binarySig = '';
  for (let i = 0; i < signatureBytes.byteLength; i++) {
    binarySig += String.fromCharCode(signatureBytes[i]);
  }
  const encodedSignature = btoa(binarySig)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const jwt = `${encodedHeader}.${encodedClaim}.${encodedSignature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenJson: any = await tokenRes.json();
  if (!tokenJson.access_token) {
    throw new Error(`Google OAuth error: ${JSON.stringify(tokenJson)}`);
  }
  return tokenJson.access_token;
}
