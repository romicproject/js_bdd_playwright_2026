import { buildUserPayload } from "../../../../support/api/users.data.js";
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

function normalizeEmail(email) {
  return String(email ?? "")
    .trim()
    .toLowerCase();
}

function getMockStore(apiContext) {
  if (!apiContext.__contractMockStore) {
    apiContext.__contractMockStore = {
      users: new Map(),
    };
  }

  return apiContext.__contractMockStore;
}

function getStoredUser(apiContext, email) {
  if (!email) return null;
  return getMockStore(apiContext).users.get(normalizeEmail(email)) ?? null;
}

function saveUser(apiContext, user) {
  const normalizedEmail = normalizeEmail(user.email);
  getMockStore(apiContext).users.set(normalizedEmail, user);
  return user;
}

function deleteUser(apiContext, email) {
  const normalizedEmail = normalizeEmail(email);
  return getMockStore(apiContext).users.delete(normalizedEmail);
}

function buildStoredUser(payload) {
  const user = buildUserPayload(payload);
  return {
    ...user,
    email: String(user.email ?? "").trim(),
    password: String(user.password ?? ""),
  };
}

function buildUserDetail(user) {
  const { password, ...safeUser } = user;
  return safeUser;
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

function handleProductsCatalog(method, pathname, searchParams, requestData) {
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

function handleCreateAccount(apiContext, requestData, pathname, method) {
  if (method !== "POST" || !/\/createaccount$/i.test(pathname)) {
    return null;
  }

  const formData = parseRequestData(requestData);
  const email = String(formData.email ?? "").trim();
  const password = String(formData.password ?? "").trim();

  if (!email || !password) {
    return jsonResponse(400, {
      responseCode: 400,
      message: "Missing required user parameter!",
    });
  }

  if (getStoredUser(apiContext, email)) {
    return jsonResponse(400, {
      responseCode: 400,
      message: "Email already exists!",
    });
  }

  const storedUser = buildStoredUser(formData);
  saveUser(apiContext, storedUser);

  return jsonResponse(201, {
    responseCode: 201,
    message: "User created!",
  });
}

function handleVerifyLogin(apiContext, requestData, pathname, method) {
  if (method !== "POST" || !/\/verifylogin$/i.test(pathname)) {
    return null;
  }

  const formData = parseRequestData(requestData);
  const email = String(formData.email ?? "").trim();
  const password = String(formData.password ?? "").trim();

  if (!email || !password) {
    return jsonResponse(400, {
      responseCode: 400,
      message: "Missing required user parameter!",
    });
  }

  const user = getStoredUser(apiContext, email);
  if (!user || user.password !== password) {
    return jsonResponse(404, {
      responseCode: 404,
      message: "User not found!",
    });
  }

  return jsonResponse(200, {
    responseCode: 200,
    message: "User exists!",
  });
}

function handleDeleteAccount(apiContext, requestData, pathname, method) {
  if (method !== "DELETE" || !/\/deleteaccount$/i.test(pathname)) {
    return null;
  }

  const formData = parseRequestData(requestData);
  const email = String(formData.email ?? "").trim();
  const password = String(formData.password ?? "").trim();

  if (!email || !password) {
    return jsonResponse(400, {
      responseCode: 400,
      message: "Missing required user parameter!",
    });
  }

  const user = getStoredUser(apiContext, email);
  if (!user || user.password !== password) {
    return jsonResponse(404, {
      responseCode: 404,
      message: "Account not found!",
    });
  }

  deleteUser(apiContext, email);

  return jsonResponse(200, {
    responseCode: 200,
    message: "Account deleted!",
  });
}

function handleGetUserDetail(apiContext, pathname, searchParams, method) {
  if (method !== "GET" || !/\/getuserdetailbyemail$/i.test(pathname)) {
    return null;
  }

  const email = String(searchParams.get("email") ?? "").trim();
  if (!email) {
    return jsonResponse(400, {
      responseCode: 400,
      message: "Email parameter is missing!",
    });
  }

  const user = getStoredUser(apiContext, email);
  if (!user) {
    return jsonResponse(404, {
      responseCode: 404,
      message: "Account not found!",
    });
  }

  return jsonResponse(200, {
    responseCode: 200,
    user: buildUserDetail(user),
  });
}

export function resolveContractDefaultMock({
  method,
  pathname,
  searchParams,
  requestData,
  apiContext,
}) {
  const normalizedPath = String(pathname || "").toLowerCase();

  return (
    handleProductsCatalog(method, normalizedPath, searchParams, requestData) ||
    handleCreateAccount(apiContext, requestData, normalizedPath, method) ||
    handleVerifyLogin(apiContext, requestData, normalizedPath, method) ||
    handleDeleteAccount(apiContext, requestData, normalizedPath, method) ||
    handleGetUserDetail(apiContext, normalizedPath, searchParams, method)
  );
}
