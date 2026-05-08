import { handleProductsCatalog } from "./products.handler.js";
import {
  handleCreateAccount,
  handleVerifyLogin,
  handleDeleteAccount,
  handleGetUserDetail,
} from "./accounts.handler.js";

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
