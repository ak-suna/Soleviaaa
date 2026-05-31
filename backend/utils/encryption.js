import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Ensures the encryption key is exactly 32 bytes.
 * If too short, it pads it. If too long, it hashes it.
 */
function getEncryptionKey() {
    const key = process.env.ENCRYPTION_KEY || 'soleviaaa_secret_encryption_key_2024';
    return crypto.createHash('sha256').update(String(key)).digest();
}

/**
 * Encrypts a string using AES-256-CBC
 * @param {string} text 
 * @returns {string} - Format: iv:encryptedData
 */
export function encrypt(text) {
    if (!text) return text;
    
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const key = getEncryptionKey();
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
        console.error('Encryption failed:', error);
        return text; // Fallback to plain text if encryption fails
    }
}

/**
 * Decrypts a string using AES-256-CBC
 * @param {string} text - Format: iv:encryptedData
 * @returns {string}
 */
export function decrypt(text) {
    if (!text || typeof text !== 'string' || !text.includes(':')) return text;
    
    try {
        const [ivHex, encryptedHex] = text.split(':');
        if (!ivHex || !encryptedHex) return text;

        const iv = Buffer.from(ivHex, 'hex');
        const key = getEncryptionKey();
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        // Only log if it looks like it was supposed to be encrypted
        if (text.length > 32 && text.includes(':')) {
            console.error('Decryption failed:', error.message);
        }
        return text; // Return original if decryption fails
    }
}
