# Audit: executable stories

These Given/When/Then scenarios distinguish a duration next from a duration completion. Read the [audit operator page](/operators/audit), then inspect the [tests](https://github.com/hansschenker/rxjs-80/blob/main/test/audit.test.ts).

```gherkin
Feature: Remember the latest source value while waiting for a duration signal

  Background:
    Given a subscribed source piped through audit with a duration selector

  Scenario: Start waiting for the duration signal
    Given no duration subscription is active
    When the source emits A
    Then audit remembers A
    And calls the duration selector with A
    And subscribes to the selected duration

  Scenario: Remember the latest source value while waiting
    Given audit is waiting with A remembered
    When the source emits B and then C
    Then audit remembers C
    And retains the existing duration subscription
    And does not call the duration selector again

  Scenario: Emit the remembered value when the duration signals
    Given audit is waiting with C remembered
    When the duration emits its first next notification
    Then audit closes the duration subscription
    And clears the pending slot before delivery
    And delivers C once

  Scenario: Stop waiting without emitting when the duration completes silently
    Given audit is waiting with A remembered
    When the duration completes without emitting
    Then audit emits no stored value
    And a later source value can start another wait

  Scenario: Source completes while a value is pending
    Given audit is waiting with C remembered
    When the source completes
    Then audit waits for the active duration
    When that duration emits next
    Then audit delivers C and completes

  Scenario: Consumer cancels
    Given source and duration subscriptions are active
    When the consumer closes its subscription
    Then both subscriptions close
    And no retained value or completion notification is delivered
```
