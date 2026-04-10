package com.crawlnews.backend.service;

import com.crawlnews.backend.domain.Category;
import com.crawlnews.backend.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<Category> findAllActive() {
        return categoryRepository.findByIsActiveTrueOrderByDisplayOrder();
    }

    @Transactional(readOnly = true)
    public List<Category> findRootCategories() {
        return categoryRepository.findByParentIsNullAndIsActiveTrueOrderByDisplayOrder();
    }

    @Transactional(readOnly = true)
    public Optional<Category> findBySlug(String slug) {
        return categoryRepository.findBySlug(slug);
    }

    @Transactional(readOnly = true)
    public Optional<Category> findById(Long id) {
        return categoryRepository.findById(id);
    }

    @Transactional
    public Category create(String name, String slug, Long parentId, int displayOrder) {
        log.info("Creating category: name={} slug={} parentId={}", name, slug, parentId);
        Category category = new Category();
        category.setName(name);
        category.setSlug(slug);
        category.setDisplayOrder(displayOrder);
        category.setIsActive(true);
        if (parentId != null) {
            Category parent = categoryRepository.findById(parentId)
                    .orElseThrow(() -> new IllegalArgumentException("Parent category not found: " + parentId));
            category.setParent(parent);
        }
        return categoryRepository.save(category);
    }

    @Transactional
    public Category update(Long id, String name, String slug, Long parentId, int displayOrder) {
        log.info("Updating category: id={} name={}", id, name);
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + id));
        category.setName(name);
        category.setSlug(slug);
        category.setDisplayOrder(displayOrder);
        if (parentId != null) {
            if (parentId.equals(id)) throw new IllegalArgumentException("Category cannot be its own parent");
            Category parent = categoryRepository.findById(parentId)
                    .orElseThrow(() -> new IllegalArgumentException("Parent category not found: " + parentId));
            category.setParent(parent);
        } else {
            category.setParent(null);
        }
        return categoryRepository.save(category);
    }

    @Transactional
    public void toggleActive(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + id));
        category.setIsActive(!category.getIsActive());
        log.info("Category toggled: id={} isActive={}", id, category.getIsActive());
        categoryRepository.save(category);
    }

    @Transactional(readOnly = true)
    public List<Category> findAll() {
        return categoryRepository.findAll();
    }
}
