# Skill-based evaluation implementation plan

1. Define a browser-safe skill catalog and derive its value type from the labeled constant.
2. Attach one or more skills and a weight to every checklist template item; require the same metadata for custom items.
3. Extend checklist DTOs and mutation schemas so task skill metadata travels from Firestore to the task board.
4. Aggregate completed task weights by skill across internship stages and expose the resulting skill profile in the checklist experience.
5. Add controlled custom-task inputs for a primary skill, optional secondary skill, and weight; render task skills and the profile in the UI.
6. Add unit/UI coverage for catalog validation, weighted aggregation, and custom-task submission, then run the full validation suite.
