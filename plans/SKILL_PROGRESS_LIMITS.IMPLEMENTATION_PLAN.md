# Skill progress limits implementation plan

1. Configure immutable maximum points for every skill and a shared 1–5 range for custom-task weights.
2. Validate custom-task weights on the server and prevent a task from being marked Done when it would exceed a skill maximum.
3. Centralize progress calculation in the shared skills module and expose completed points, maximum points, and percentage for a future Skill Matrix.
4. Update the task-board display and add focused regression tests.
