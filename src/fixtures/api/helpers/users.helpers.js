// fixtures/api/helpers/users.helpers.js
import { formBody, FORM_HEADERS } from './utils.js';

const DEFAULT_USER_FIELDS = {
  name: 'Auto User',
  title: 'Mr',
  birth_date: '1',
  birth_month: '1',
  birth_year: '1990',
  firstname: 'Auto',
  lastname: 'User',
  company: 'Test Company',
  address1: '123 Test St',
  country: 'United States',
  zipcode: '12345',
  state: 'Test State',
  city: 'Test City',
  mobile_number: '1234567890'
};

export function createUsersHelpers(apiClient) {
  function withFormHeaders(options = {}) {
    return {
      ...options,
      headers: { ...FORM_HEADERS, ...(options.headers || {}) }
    };
  }

  return {
    async createUser(userData, options = {}) {
      const merged = { ...DEFAULT_USER_FIELDS, ...(userData || {}) };
      return apiClient.post('/createAccount', formBody(merged), withFormHeaders(options));
    },

    async verifyLogin(loginData, options = {}) {
      return apiClient.post('/verifyLogin', formBody(loginData || {}), withFormHeaders(options));
    },

    async deleteAccount(deleteData, options = {}) {
      return apiClient.delete('/deleteAccount', formBody(deleteData || {}), withFormHeaders(options));
    },

    async updateAccount(userData, options = {}) {
      return apiClient.put('/updateAccount', formBody(userData || {}), withFormHeaders(options));
    },

    async getUserDetailByEmail(email, options = {}) {
      if (email == null) throw new Error('email is required');
      const params = new URLSearchParams({ email: String(email) });
      return apiClient.get(`/getUserDetailByEmail?${params.toString()}`, options);
    }
  };
}