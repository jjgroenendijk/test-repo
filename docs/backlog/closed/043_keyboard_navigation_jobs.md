# Keyboard Navigation for Jobs

## Description
Currently, the user has to use Tab to go through every single button in the job list. It would be helpful to allow keyboard navigation between job cards using arrow keys.

## Requirements
- Add `tabindex="0"` to job cards so they can receive focus.
- Allow using Up/Down arrow keys to move focus between job cards in the list.
- Add an accessible `aria-label` to the job card to identify the job.
