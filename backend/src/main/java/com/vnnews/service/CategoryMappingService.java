package com.vnnews.service;

import com.vnnews.entity.Category;
import com.vnnews.entity.CategoryMapping;
import com.vnnews.repository.CategoryMappingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CategoryMappingService {

    private final CategoryMappingRepository categoryMappingRepository;
    private final CategoryService categoryService;

    public Category resolveCategory(String sourceName, String sourceCategory) {
        Optional<CategoryMapping> mapping = categoryMappingRepository
                .findBySourceNameAndSourceCategory(sourceName, sourceCategory);
        if (mapping.isPresent()) {
            return mapping.get().getCategory();
        }
        // Auto-create category if mapping not found
        return categoryService.getOrCreateCategory(sourceCategory);
    }
}
