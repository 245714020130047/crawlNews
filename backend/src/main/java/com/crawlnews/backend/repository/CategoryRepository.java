package com.crawlnews.backend.repository;

import com.crawlnews.backend.domain.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findBySlug(String slug);
    List<Category> findByParentIsNullAndIsActiveTrueOrderByDisplayOrder();
    List<Category> findByParentIdAndIsActiveTrueOrderByDisplayOrder(Long parentId);
    List<Category> findByIsActiveTrueOrderByDisplayOrder();
    boolean existsBySlug(String slug);
    boolean existsById(Long id);
}
