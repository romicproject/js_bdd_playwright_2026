@smoke @ui
Feature: Reach the Authentication Flow from Home
  As a visitor
  I want to open the signup/login experience from the landing page
  So I can verify the expected UI state for authentication

  Scenario: Home page leads to the Signup / Login screen
    Given I open the AutomationExercise home page
    When I navigate to the Signup Login page
    Then I should see the login heading and the signup URL

  @regression @ui
  Scenario: Navigate to Contact Us page from home
    Given I open the AutomationExercise home page
    When I navigate to the "Contact Us" page from home
    Then I should see the Contact Us heading and URL

  @regression @ui
  Scenario: Navigate to Products page from home
    Given I open the AutomationExercise home page
    When I navigate to the "Products" page from home
    Then I should see the products list and URL

  @regression @ui
  Scenario: Search for a product from Products page
    Given I open the AutomationExercise home page
    When I navigate to the "Products" page from home
    Then I should see the products list and URL
    And I search for UI product "Dress"
    Then I should see searched products related to "Dress"
