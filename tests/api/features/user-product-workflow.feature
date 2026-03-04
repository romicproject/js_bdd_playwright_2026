@api @workflow @regression
Feature: User and Product Workflow
  As a user
  I want to complete end-to-end workflows
  So that I can verify the system works correctly

  Background:
    Given the API is available

  @positive
  Scenario: New user searches for products
    When I create a user with:
      | name     | Product Searcher              |
      | email    | searcher.{timestamp}@test.com |
      | password | Search123!                    |
    Then the response status should be 201

    When I verify login with the created user credentials
    Then the response status should be 200

    When I search for product "shirt"
    Then the response status should be 200
    And the response should contain products matching "shirt"

  @positive
  Scenario: User lifecycle - create, login, delete
    When I create a user with:
      | name     | Lifecycle User                 |
      | email    | lifecycle.{timestamp}@test.com |
      | password | Life123!                       |
    Then the response status should be 201
    And I save the created user email

    When I verify login with the saved user credentials
    Then the response status should be 200

    When I delete account with the saved user credentials
    Then the response status should be 200

    When I get user detail by the saved user email
    Then the response status should be 404

    When I verify login with the saved user credentials
    Then the response status should be 404