// fixtures/api/helpers/users.helpers.js
import { buildUserPayload } from "../../../support/api/users.data.js";
import { formBody, FORM_HEADERS } from "./utils.js";

export function createUsersHelpers(apiClient) {
  function withFormHeaders(options = {}) {
    return {
      ...options,
      headers: { ...FORM_HEADERS, ...(options.headers || {}) },
    };
  }

  return {
    async createUser(userData, options = {}) {
      return apiClient.post(
        "/createAccount",
        formBody(buildUserPayload(userData)),
        withFormHeaders(options),
      );
    },

    async verifyLogin(loginData, options = {}) {
      return apiClient.post(
        "/verifyLogin",
        formBody(loginData || {}),
        withFormHeaders(options),
      );
    },

    async deleteAccount(deleteData, options = {}) {
      return apiClient.delete(
        "/deleteAccount",
        formBody(deleteData || {}),
        withFormHeaders(options),
      );
    },
    async getUserDetailByEmail(email, options = {}) {
      if (email == null) throw new Error("email is required");
      const params = new URLSearchParams({ email: String(email) });
      return apiClient.get(
        `/getUserDetailByEmail?${params.toString()}`,
        options,
      );
    },
  };
}
