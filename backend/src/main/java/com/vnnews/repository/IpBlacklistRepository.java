package com.vnnews.repository;

import com.vnnews.entity.IpBlacklist;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.Optional;

public interface IpBlacklistRepository extends JpaRepository<IpBlacklist, Long> {
    Optional<IpBlacklist> findByIpAddress(String ipAddress);
    boolean existsByIpAddressAndBlockedUntilAfter(String ipAddress, LocalDateTime now);
    boolean existsByIpAddressAndBlockedUntilIsNull(String ipAddress);
}
