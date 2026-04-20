package com.vnnews.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class GeoIpService {

    public Map<String, String> lookup(String ip) {
        Map<String, String> result = new HashMap<>();
        try {
            // For local/private IPs, return empty geo data
            if (ip == null || ip.startsWith("127.") || ip.startsWith("192.168.")
                    || ip.startsWith("10.") || ip.equals("0:0:0:0:0:0:0:1")) {
                result.put("city", "Local");
                result.put("region", "Local");
                result.put("country", "Local");
                return result;
            }
            // MaxMind GeoIP2 integration placeholder
            // In production, load GeoLite2 database and perform lookup
            result.put("city", "Unknown");
            result.put("region", "Unknown");
            result.put("country", "Unknown");
        } catch (Exception e) {
            log.warn("GeoIP lookup failed for IP: {}", ip, e);
            result.put("city", "Unknown");
            result.put("region", "Unknown");
            result.put("country", "Unknown");
        }
        return result;
    }
}
