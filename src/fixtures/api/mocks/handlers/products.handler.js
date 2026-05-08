import { buildMockProduct } from "../helpers.js";

const MOCK_PRODUCTS = [
  buildMockProduct(1, "Blue Top", "Rs. 500", "Polo", "Tops", "Women"),
  buildMockProduct(2, "Men Tshirt", "Rs. 400", "H&M", "Tshirts", "Men"),
  buildMockProduct(
    3,
    "Sleeveless Dress",
    "Rs. 1000",
    "Madame",
    "Dress",
    "Women",
  ),
  buildMockProduct(
    4,
    "T-shirt & Jeans Combo",
    "Rs. 1200",
    "Roadster",
    "Sets",
    "Men",
  ),
];

const MOCK_BRANDS = [
  { id: 1, brand: "Polo" },
  { id: 2, brand: "H&M" },
  { id: 3, brand: "Madame" },
  { id: 4, brand: "Roadster" },
];

const MOCK_HEADERS = {
  "content-type": "application/json",
  "x-mock-profile": "contract-default",
};

function jsonResponse(status, body) {
  return {
    status,
    headers: MOCK_HEADERS,
    body,
  };
}

function parseRequestData(requestData) {
  if (requestData == null) return {};

  if (typeof requestData === "string") {
    return Object.fromEntries(new URLSearchParams(requestData));
  }

  if (requestData instanceof URLSearchParams) {
    return Object.fromEntries(requestData.entries());
  }

  if (typeof requestData === "object") {
    return { ...requestData };
  }

  return {};
}

function getSearchTerm(method, searchParams, requestData) {
  if (method === "GET") {
    const value = searchParams.get("search_product");
    return value == null ? null : value;
  }

  const formData = parseRequestData(requestData);
  if (!Object.hasOwn(formData, "search_product")) {
    return null;
  }

  return formData.search_product;
}

function searchProducts(searchTerm) {
  const normalizedTerm = String(searchTerm ?? "")
    .trim()
    .toLowerCase();
  return MOCK_PRODUCTS.filter((product) => {
    const haystack =
      `${product.name} ${product.brand} ${product.category?.category || ""}`.toLowerCase();
    return haystack.includes(normalizedTerm);
  });
}

export function handleProductsCatalog(
  method,
  pathname,
  searchParams,
  requestData,
) {
  if (method === "GET" && /\/productslist$/i.test(pathname)) {
    return jsonResponse(200, {
      responseCode: 200,
      products: MOCK_PRODUCTS,
    });
  }

  if (method === "GET" && /\/brandslist$/i.test(pathname)) {
    return jsonResponse(200, {
      responseCode: 200,
      brands: MOCK_BRANDS,
    });
  }

  const isSearchEndpoint =
    /\/searchproduct$/i.test(pathname) &&
    (method === "GET" || method === "POST");
  if (!isSearchEndpoint) {
    return null;
  }

  const searchTerm = getSearchTerm(method, searchParams, requestData);
  if (searchTerm == null || String(searchTerm).length === 0) {
    return jsonResponse(400, {
      responseCode: 400,
      message: "Search product parameter is missing!",
    });
  }

  return jsonResponse(200, {
    responseCode: 200,
    products: searchProducts(searchTerm),
  });
}
