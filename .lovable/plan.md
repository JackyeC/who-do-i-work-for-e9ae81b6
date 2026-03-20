

## Replace "Show More" with Pagination on /browse

### Changes

**`src/pages/Browse.tsx`**

1. Replace `visibleCount` state with `currentPage` state (starting at 1)
2. Compute `totalPages`, `visibleCompanies` from `currentPage` and `PAGE_SIZE`
3. Reset `currentPage` to 1 when filters/search change (already handled since `filtered` recalculates)
4. Replace the "Show More" button block with a pagination bar using the existing `Pagination` components from `src/components/ui/pagination.tsx`:
   - Previous / Next buttons (disabled at boundaries)
   - Page number links with ellipsis for large page counts
   - Shows "Page X of Y" count
5. Scroll to top of the list when page changes

Single file change, no new dependencies.

