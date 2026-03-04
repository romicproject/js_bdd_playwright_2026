@api @users
Feature: User Account Management API
  As an API consumer
  I want to manage user accounts
  So that users can register, login, and delete their accounts

  Background:
    Given the API is available

  @smoke @positive
  Scenario: Create new user account successfully
    When I create a user with:
      | name          | John Doe                      |
      | email         | john.doe.{timestamp}@test.com |
      | password      | Test123!                      |
      | title         | Mr                            |
      | birth_date    | 15                            |
      | birth_month   | 7                             |
      | birth_year    | 1990                          |
      | firstname     | John                          |
      | lastname      | Doe                           |
      | company       | Test Corp                     |
      | address1      | 123 Test St                   |
      | country       | United States                 |
      | zipcode       | 12345                         |
      | state         | California                    |
      | city          | Los Angeles                   |
      | mobile_number | +1234567890                   |
    Then the response status should be 201
    And the response message should indicate "account created"

  @smoke @positive
  Scenario: Login with valid credentials
    Given a user exists with email "ceva@pceva.com" and password "ceva@123"
    When I verify login with:
      | email    | ceva@pceva.com |
      | password | ceva@123       |
    Then the response status should be 200

  @regression @negative
  Scenario: Create user with duplicate email
    Given a user exists with email "duplicate@test.com"
    When I create a user with:
      | name     | Duplicate User     |
      | email    | duplicate@test.com |
      | password | Test123!           |
    Then the response status should be 400
    And the response message should indicate "email already exists"

  @regression @negative
  Scenario: Login with invalid credentials
    When I verify login with:
      | email    | nonexistent@test.com |
      | password | WrongPassword123!    |
    Then the response status should be 404
    And the response message should indicate "user not found"

  @regression @negative
  Scenario: Login with missing email
    When I verify login with:
      | password | SomePassword123! |
    Then the response status should be 400
    And the response message should indicate "missing parameter"

  @smoke @positive
  Scenario: Delete user account successfully
    Given a user exists with email "todelete.{timestamp}@test.com"
    When I delete account with the saved user credentials
    Then the response status should be 200
    And the response message should indicate "account deleted"

    When I get user detail by the saved user email
    Then the response status should be 404