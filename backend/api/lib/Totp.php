<?php
// backend/api/lib/Totp.php

class Totp {
    /**
     * Decode a base32 string to binary bytes.
     */
    public static function base32Decode(string $base32): string {
        $base32 = strtoupper($base32);
        if (empty($base32)) return '';
        
        if (!preg_match('/^[A-Z2-7=]+$/', $base32)) {
            throw new Exception('Invalid base32 characters');
        }
        
        $base32 = str_replace('=', '', $base32);
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $binary = '';
        
        foreach (str_split($base32) as $char) {
            $val = strpos($chars, $char);
            if ($val === false) continue;
            $binary .= str_pad(decbin($val), 5, '0', STR_PAD_LEFT);
        }
        
        $bytes = str_split($binary, 8);
        $out = '';
        foreach ($bytes as $byte) {
            if (strlen($byte) === 8) {
                $out .= chr(bindec($byte));
            }
        }
        return $out;
    }

    /**
     * Generate 6-digit TOTP code for a specific time window.
     */
    public static function generateCode(string $secret, int $timeWindow): string {
        $secretKey = self::base32Decode($secret);
        
        // Pack time window into 64-bit binary representation
        $timeBin = pack('N*', 0) . pack('N*', $timeWindow);
        
        // Calculate SHA1 HMAC
        $hash = hash_hmac('sha1', $timeBin, $secretKey, true);
        
        // Get offset from last byte
        $offset = ord($hash[19]) & 0xf;
        
        // Dynamic truncation to extract 31-bit integer
        $otpBin = (
            ((ord($hash[$offset]) & 0x7f) << 24) |
            ((ord($hash[$offset + 1]) & 0xff) << 16) |
            ((ord($hash[$offset + 2]) & 0xff) << 8) |
            (ord($hash[$offset + 3]) & 0xff)
        );
        
        $otp = $otpBin % 1000000;
        return str_pad((string)$otp, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Verify user code with temporal drift tolerance (discrepancy = 1 window = +/- 30s).
     */
    public static function verifyCode(string $secret, string $code, int $discrepancy = 1): bool {
        $currentTimeWindow = (int)floor(time() / 30);
        for ($i = -$discrepancy; $i <= $discrepancy; $i++) {
            $calculatedCode = self::generateCode($secret, $currentTimeWindow + $i);
            if (hash_equals($calculatedCode, $code)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Generate a secure random Base32 TOTP secret.
     */
    public static function generateSecret(int $length = 16): string {
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = '';
        for ($i = 0; $i < $length; $i++) {
            $secret .= $chars[random_int(0, 31)];
        }
        return $secret;
    }
}
