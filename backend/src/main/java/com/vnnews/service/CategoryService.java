package com.vnnews.service;

import com.vnnews.dto.CategoryDto;
import com.vnnews.entity.Category;
import com.vnnews.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Cacheable(value = "categories")
    public List<CategoryDto> getActiveCategories() {
        return categoryRepository.findByActiveTrue().stream().map(this::toDto).toList();
    }

    public Optional<CategoryDto> getCategoryBySlug(String slug) {
        return categoryRepository.findBySlug(slug).map(this::toDto);
    }

    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryDto createCategory(CategoryDto dto) {
        Category category = new Category();
        category.setName(dto.getName());
        category.setSlug(dto.getSlug() != null ? dto.getSlug() : toSlug(dto.getName()));
        category.setDescription(dto.getDescription());
        category.setSortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0);
        category.setActive(dto.getActive() != null ? dto.getActive() : true);
        category.setAutoCreated(dto.getAutoCreated() != null ? dto.getAutoCreated() : false);
        return toDto(categoryRepository.save(category));
    }

    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryDto updateCategory(Long id, CategoryDto dto) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found: " + id));
        if (dto.getName() != null) category.setName(dto.getName());
        if (dto.getSlug() != null) category.setSlug(dto.getSlug());
        if (dto.getDescription() != null) category.setDescription(dto.getDescription());
        if (dto.getSortOrder() != null) category.setSortOrder(dto.getSortOrder());
        if (dto.getActive() != null) category.setActive(dto.getActive());
        return toDto(categoryRepository.save(category));
    }

    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }

    @Transactional
    public Category getOrCreateCategory(String name) {
        String slug = toSlug(name);
        return categoryRepository.findBySlug(slug).orElseGet(() -> {
            Category cat = new Category();
            cat.setName(name);
            cat.setSlug(slug);
            cat.setActive(true);
            cat.setAutoCreated(true);
            cat.setSortOrder(99);
            return categoryRepository.save(cat);
        });
    }

    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream().map(this::toDto).toList();
    }

    private static final Pattern NON_LATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]+");

    public static String toSlug(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        normalized = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        normalized = normalized.replaceAll("đ", "d").replaceAll("Đ", "D");
        normalized = WHITESPACE.matcher(normalized).replaceAll("-");
        normalized = NON_LATIN.matcher(normalized).replaceAll("");
        return normalized.toLowerCase().replaceAll("-{2,}", "-").replaceAll("^-|-$", "");
    }

    private CategoryDto toDto(Category c) {
        return CategoryDto.builder()
                .id(c.getId())
                .name(c.getName())
                .slug(c.getSlug())
                .description(c.getDescription())
                .parentId(c.getParent() != null ? c.getParent().getId() : null)
                .sortOrder(c.getSortOrder())
                .active(c.getActive())
                .autoCreated(c.getAutoCreated())
                .build();
    }
}
