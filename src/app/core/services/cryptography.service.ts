import { Injectable } from '@angular/core';
import ConversionUtils from '../utils/conversion.utils';

@Injectable({ providedIn: 'root' })
export class CryptographyService {
    public async GenerateAsymmetricKeyPair() {
        const keyPair = await window.crypto.subtle.generateKey({
            name: 'RSA-OAEP',
            modulusLength: 4096,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: 'SHA-256'
        }, true, ['encrypt', 'decrypt']);

        const publicKeyBytes = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
        const privateKeyBytes = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

        return {
            publicKey: ConversionUtils.BufferToBase64(publicKeyBytes),
            privateKey: ConversionUtils.BufferToBase64(privateKeyBytes)
        };
    }
}