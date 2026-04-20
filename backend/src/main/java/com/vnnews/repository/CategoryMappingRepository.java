package com.vnnews.repository;

import com.vnnews.entity.CategoryMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CategoryMappingRepository extends JpaRepository<CategoryMapping, Long> {
    Optional<CategoryMapping> findBySourceNameAndSourceCategory(String sourceName, String sourceCategory);
    List<CategoryMapping> findBySourceName(String sourceName);
}
