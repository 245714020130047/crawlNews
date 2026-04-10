package com.crawlnews.backend.web.admin;

import com.crawlnews.backend.domain.Category;
import com.crawlnews.backend.service.CategoryService;
import com.crawlnews.backend.web.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
@Tag(name = "Admin - Categories", description = "Manage categories")
public class AdminCategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "List all categories")
    public ResponseEntity<ApiResponse<List<Category>>> listAll() {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.findAll()));
    }

    @PostMapping
    @Operation(summary = "Create a category")
    public ResponseEntity<ApiResponse<Category>> create(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String slug = (String) body.get("slug");
        Long parentId = body.get("parentId") != null ? Long.valueOf(body.get("parentId").toString()) : null;
        int displayOrder = body.get("displayOrder") != null ? Integer.parseInt(body.get("displayOrder").toString()) : 0;
        Category category = categoryService.create(name, slug, parentId, displayOrder);
        return ResponseEntity.ok(ApiResponse.ok(category, "Category created"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a category")
    public ResponseEntity<ApiResponse<Category>> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String slug = (String) body.get("slug");
        Long parentId = body.get("parentId") != null ? Long.valueOf(body.get("parentId").toString()) : null;
        int displayOrder = body.get("displayOrder") != null ? Integer.parseInt(body.get("displayOrder").toString()) : 0;
        Category category = categoryService.update(id, name, slug, parentId, displayOrder);
        return ResponseEntity.ok(ApiResponse.ok(category, "Category updated"));
    }

    @PatchMapping("/{id}/toggle")
    @Operation(summary = "Toggle category active status")
    public ResponseEntity<ApiResponse<Void>> toggle(@PathVariable Long id) {
        categoryService.toggleActive(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Category toggled"));
    }
}
