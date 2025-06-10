# **App Name**: Gemini Review

## Core Features:

- Diff Generation: Generate a diff file from the current git repository, showing changes against master/main.
- Gemini Code Review: Send the diff file to the Gemini API to perform a code review, prioritizing issues, problems, and key areas of improvement by default. Can use the --full-review tool option for more nitpicks.
- Review Output: Display the code review output, offering an option to save it as a .md file.
- Model Selection: Provide options to select the Gemini model (Flash or Pro). Flash is used by default but pro version available by flag. Provides flags to choose a LLM tool
- File Management: Optionally keep the .diff file after the review using a --keep-files option.
- Confirmation Prompt: Before API usage, show the number of files and estimated token consumption and require user confirmation.

## Style Guidelines:

- Primary color: Vibrant blue (#29ABE2) for a modern and trustworthy feel.
- Background color: Light gray (#F5F5F5) to ensure readability and a clean interface.
- Accent color: Orange (#FF9933) to highlight important messages or actionable items.
- Body and headline font: 'Inter', a sans-serif font, providing a modern and clean feel for easy readability.
- Use simple, clear icons for actions like 'save,' 'review,' and 'confirm'.
- Maintain a clean and well-organized layout, prioritizing readability of both the code diff and the review output.