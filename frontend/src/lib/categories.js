export const categoryColors = {
  Farm: "#2d6a4f",
  Artisan: "#8f2d56",
  Food: "#d87324",
  Vintage: "#2f6690",
  Thrift: "#7a5c39",
  Market: "#2d6a4f",
  Workshop: "#8f2d56",
  "Pop-Up": "#d87324",
  Community: "#2f6690",
  Volunteer: "#1f7a8c",
  default: "#475569",
};

export const categoryOrder = [
  "Farm",
  "Artisan",
  "Food",
  "Vintage",
  "Thrift",
  "Market",
  "Workshop",
  "Pop-Up",
  "Community",
  "Volunteer",
];

export const vendorCategories = ["Farm", "Artisan", "Food", "Vintage", "Thrift", "Market", "Community", "Volunteer"];
export const eventCategories = ["Market", "Workshop", "Pop-Up", "Community", "Food", "Thrift", "Volunteer"];

export function colorForCategory(category) {
  return categoryColors[category] ?? categoryColors.default;
}

export function sortCategories(categories = []) {
  const unique = Array.from(new Set(categories.filter(Boolean)));

  return unique.sort((left, right) => {
    const leftIndex = categoryOrder.indexOf(left);
    const rightIndex = categoryOrder.indexOf(right);

    if (leftIndex >= 0 && rightIndex >= 0) {
      return leftIndex - rightIndex;
    }
    if (leftIndex >= 0) {
      return -1;
    }
    if (rightIndex >= 0) {
      return 1;
    }
    return left.localeCompare(right);
  });
}
