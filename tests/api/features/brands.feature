# tests/api/features/brands.feature

@api @brands
Feature: Brands API
  As an API consumer
  I want to retrieve the list of brands
  So that I can display them in my application

  @smoke @positive
  Scenario: Get all brands
    When I get all brands
    Then the response status should be 200
    And the response should contain brands
    And each brand should have required fields

  @regression @positive
  Scenario: Brands response contains all required fields
    When I get all brands
    Then the response status should be 200
    And the response should contain brands
    And each brand should have required fields
