@ui @register
Feature: User Registration - Create Account
  As a new visitor
  I want to create an account
  So I can access authenticated user capabilities

  @smoke
  Scenario: Successful registration creates a new account
    Given I am on the Signup Login page
    When I register a new user with unique credentials
    Then I should see the account created confirmation
    And I should see the user logged in successfully

  @regression
  Scenario: Registering with an already-used email shows an error
    Given an account exists for a unique user
    When I try to register again with the same email
    Then I should see an email already exists error message
