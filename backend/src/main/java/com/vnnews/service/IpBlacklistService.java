package com.vnnews.service;

import com.vnnews.repository.IpBlacklistRepository;
import com.vnnews.entity.IpBlacklist;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class IpBlacklistService {

    private final IpBlacklistRepository ipBlacklistRepository;

    public Page<IpBlacklist> getAll(Pageable pageable) {
        return ipBlacklistRepository.findAll(pageable);
    }

    @Transactional
    public IpBlacklist blockIp(String ipAddress, String reason, LocalDateTime blockedUntil, String createdBy) {
        IpBlacklist entry = ipBlacklistRepository.findByIpAddress(ipAddress).orElse(new IpBlacklist());
        entry.setIpAddress(ipAddress);
        entry.setReason(reason);
        entry.setBlockedAt(LocalDateTime.now());
        entry.setBlockedUntil(blockedUntil);
        entry.setCreatedBy(createdBy);
        return ipBlacklistRepository.save(entry);
    }

    @Transactional
    public void unblockIp(Long id) {
        ipBlacklistRepository.deleteById(id);
    }
}
