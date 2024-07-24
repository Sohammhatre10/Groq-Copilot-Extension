# Soham's Copilot

Soham's Copilot is a Visual Studio Code extension that integrates with the LangChain API and Groq model llama-3 to provide code suggestions and corrections. The extension offers two primary commands: "Hello World" and "Process Code".

## Features

- **Process Code Command**: Analyzes and corrects selected code, providing suggestions as comments beside the code.

## Installation

1. Ensure you have Node.js and npm installed on your machine.
2. Clone this repository or download the code.
3. Navigate to the extension's root directory and run:

```bash
npm install
```

4. Open the extension's directory in Visual Studio Code.
5. Press `F5` to open a new VS Code window with the extension loaded.

## Configuration

The extension requires API keys for the LangChain and Groq APIs. Set the following environment variables with your respective API keys:

- `GROQ_API_KEY`
- `LANGCHAIN_API_KEY`

## Usage

### Process Code Command

1. Select the code you want to process in an active text editor.
2. Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS).
3. Type `Soham's Copilot: Process Code` and press `Enter`.
4. The selected code will be analyzed, and suggestions will be added as comments beside the code.

## Development

To contribute or modify the extension:

1. Fork and clone the repository.
2. Make your changes and create a pull request.

## Troubleshooting

If you encounter issues:

- Ensure your API keys are correctly set in the environment variables.
- Check for any error messages in the console output.
- Verify that the selected code is appropriate and supported by the extension.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- LangChain API
- Groq model llama-3
- Visual Studio Code

---
