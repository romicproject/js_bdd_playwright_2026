@api @mock
Feature: Mocked API regression coverage
  As a framework maintainer
  I want fast deterministic API scenarios
  So that regression coverage scales without live-environment flake

  @regression @positive
  Scenario: Search for existing product with contract mock
    When I search for product "shirt"
    Then the response status should be 200
    And the response should match product list schema
    And the response should contain products matching "shirt"

  @regression @negative
  Scenario: Search with empty search term on contract mock
    When I search for product ""
    Then the response status should be 400
    And the response message should indicate "missing parameter"

  @regression @positive
  Scenario: Get all brands with contract mock
    When I get all brands
    Then the response status should be 200
    And the response should contain brands
    And each brand should have required fields

  @regression @negative
  Scenario: Duplicate user is rejected by contract mock
    Given a user exists with email "mock.duplicate.{unique}@test.com"
    When I create a user with:
      | name     | Duplicate User                 |
      | email    | mock.duplicate.{unique}@test.com |
      | password | Test123!                       |
    Then the response status should be 400
    And the response message should indicate "email already exists"

  @workflow @regression @positive
  Scenario: User lifecycle is fully simulated by contract mock
    When I create a user with:
      | name     | Mock Lifecycle                 |
      | email    | mock.lifecycle.{unique}@test.com |
      | password | Life123!                       |
    Then the response status should be 201
    And I save the created user email

    When I verify login with the saved user credentials
    Then the response status should be 200

    When I delete account with the saved user credentials
    Then the response status should be 200

    When I get user detail by the saved user email
    Then the response status should be 404
