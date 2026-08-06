# Task board implementation plan

1. Replace the checklist presentation with a three-column task board: To do, In progress, and Done. Completed.
2. Keep task priority as Required or Recommended and allow mentors and managers to add tasks to the current stage. In progress: repair task creation and tighten its role access.
3. Persist task status and custom tasks in the stage-progress document while remaining compatible with existing completed checklist data. Completed.
4. Model the stage review flow as Active → Under mentor review → Completed, with mentor/manager approval or a request for changes.
5. Let users navigate permitted lifecycle stages: interns can view completed and current stages; mentors and managers can view every stage.
6. Add regression tests for task creation, review status, lifecycle access, and task movement.
