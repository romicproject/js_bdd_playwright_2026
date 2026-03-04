# tests/api/features/products.feature

@api @products
Feature: Products API
  As an API consumer
  I want to retrieve and search products
  So that I can display them in my application

  Background:
    Given the API is available

  @smoke @positive
  Scenario: Get all products successfully
    When I get all products
    Then the response status should be 200
    And the response should match product list schema
    And the response should contain products
    And each product should have required fields

  @smoke @positive
  Scenario: Search for existing product
    When I search for product "shirt"
    Then the response status should be 200
    And the response should match product list schema
    And the response should contain products matching "shirt"

  @regression @positive
  Scenario: Search with special characters
    When I search for product "t-shirt & jeans"
    Then the response status should be 200
    And the response should match product list schema

  @regression @negative
  Scenario: Search for non-existing product
    When I search for product "xyz123nonexistent999"
    Then the response status should be 200
    And the response should match product list schema
    And the products list should be empty

  @regression @negative
  Scenario: Search with empty search term
    When I search for product ""
    Then the response status should be 200
    And the response should match product list schema

  @regression @positive
  Scenario: Get all brands
    When I get all brands
    Then the response status should be 200
    And the response should contain brands
    And each brand should have required fields