import crypto from 'node:crypto';
import { config } from '../config/index.js';

export interface ImageKitAuthResponse {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
}

export class ImageKitService {
  /**
   * Generates ImageKit client-side upload authentication signature using HMAC-SHA1.
   * Signature is created using private key without ever sending private key to client.
   */
  public getAuthenticationParameters(): ImageKitAuthResponse {
    const token = crypto.randomUUID();
    const expire = Math.floor(Date.now() / 1000) + 1800; // 30 minutes validity
    const privateKey = config.imageKitPrivateKey;

    if (!privateKey) {
      throw new Error('ImageKit private key not configured on backend');
    }

    const dataToSign = `${token}${expire}`;
    const signature = crypto
      .createHmac('sha1', privateKey)
      .update(dataToSign)
      .digest('hex');

    return {
      token,
      expire,
      signature,
      publicKey: config.imageKitPublicKey,
      urlEndpoint: config.imageKitUrlEndpoint,
    };
  }

  /**
   * Backend direct file upload to ImageKit (used when mobile streams file payload to backend)
   */
  public async uploadFile(fileData: string, fileName: string, folder: string = '/loanpoint_vault'): Promise<any> {
    const privateKey = config.imageKitPrivateKey;
    if (!privateKey) {
      throw new Error('ImageKit private key is not configured');
    }

    const authHeader = `Basic ${Buffer.from(`${privateKey}:`).toString('base64')}`;
    const formParams = new URLSearchParams();
    formParams.append('file', fileData);
    formParams.append('fileName', fileName);
    formParams.append('folder', folder);
    formParams.append('useUniqueFileName', 'true');

    const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      body: formParams.toString(),
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`ImageKit Upload API error: ${errText}`);
    }

    return await res.json();
  }
}

export const imageKitService = new ImageKitService();
