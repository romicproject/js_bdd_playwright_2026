function mockProduct(id, name, price, brand, categoryName, userType) {
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

const productsListBody = {
  responseCode: 200,
  products: [
    mockProduct(1, "Blue Top", "Rs. 500", "Polo", "Tops", "Women"),
    mockProduct(2, "Men Tshirt", "Rs. 400", "H&M", "Tshirts", "Men"),
    mockProduct(3, "Sleeveless Dress", "Rs. 1000", "Madame", "Dress", "Women"),
  ],
};

export function resolveProductsHappyMock({ method, pathname }) {
  const normalizedPath = String(pathname || "").toLowerCase();
  const isProductsList =
    method === "GET" && /\/productslist$/.test(normalizedPath);

  if (!isProductsList) return null;

  return {
    status: 200,
    headers: {
      "content-type": "application/json",
      "x-mock-profile": "products-happy",
    },
    body: productsListBody,
  };
}
