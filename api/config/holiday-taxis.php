<?php
// api/config/holiday-taxis.php - Holiday Taxis API Configuration
// 🔄 เปลี่ยนตาม company: 'phuket-gevalin' หรือ 'tp-travel'

class HolidayTaxisConfig
{
    // 🏢 TP Travel Configuration 
    const API_KEY = 'htscon_fd8a9d60c363c15e3be1ff427dac2e31f5ee1521eeac523fb7c655899acf414cb45135d7dcd81841';
    const API_ENDPOINT = 'https://suppliers.holidaytaxis.com';
    const API_VERSION = '2025-01';

    /**
     * Get API headers for requests
     */
    public static function getHeaders()
    {
        return [
            'Content-Type: application/json',
            'Accept: application/json',
            'Authorization: Bearer ' . self::API_KEY,
            'X-API-Version: ' . self::API_VERSION
        ];
    }

    /**
     * Get full API URL
     */
    public static function getApiUrl($endpoint)
    {
        return self::API_ENDPOINT . '/' . ltrim($endpoint, '/');
    }
}
