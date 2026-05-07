// fixtures/api/mocks/helpers.js
/**
 * Mock data helpers for consistent structure across profiles
 */

export function buildMockProduct(
  id,
  name,
  price,
  brand,
  categoryName,
  userType,
) {
  return {
    id,
    name,
    price,
    brand,
    category: {
      usertype: { usertype: userType },
      category: categoryName,
    },
  };
}
