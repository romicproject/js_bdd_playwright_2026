export const DEFAULT_USER_FIELDS = {
  name: "Test User",
  title: "Mr",
  birth_date: "1",
  birth_month: "1",
  birth_year: "1990",
  firstname: "Test",
  lastname: "User",
  company: "Test Company",
  address1: "123 Test St",
  country: "United States",
  zipcode: "12345",
  state: "Test State",
  city: "Test City",
  mobile_number: "1234567890",
};

export function buildUserPayload(overrides = {}) {
  return {
    ...DEFAULT_USER_FIELDS,
    ...overrides,
  };
}
