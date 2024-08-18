# Groq-Code-Copilot

A Visual Studio Code extension that integrates with the Groq API to provide code suggestions and interactive assistance. Enhance your coding with suggestions and ask questions about them directly within VS Code.

## Features

- **Code Suggestions:** Automatically receive code suggestions based on the selected snippet using Groq’s LLaMA-3 model.
- **Interactive Queries:** Ask clarifying questions about the suggestions to get more details or explanations.
- **Code Replacement:** Replace your selected code with the suggestions from the extension.

## Installation

1. **Install the Extension:**

   - Click on the "Install" button at the top of this page, or use the VS Code extension marketplace to search for "Groq-Code-Copilot" and install it.

2. **Configure the API Key:**
   - After installation, use the `Show Code Suggestions` command from the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS).
   - You will be prompted to enter your Groq API key. Obtain the key from [Groq Console](https://console.groq.com/keys) and paste it into the prompt.

## Usage

1. **Show Code Suggestions:**

   - Select a piece of code in your editor.
   - Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS) and run the `Show Code Suggestions` command.

2. **Interact with the Suggestions:**
   - A new webview panel will open showing the code suggestion.
   - You can ask questions about the suggestion or replace your code with the suggested code using the buttons provided in the webview.

## Troubleshooting

- **API Key Issues:** Ensure that you have correctly entered the Groq API key when prompted. If you encounter issues, try re-entering the key.
- **Extension Not Working:** Make sure the extension is correctly installed and try restarting Visual Studio Code if you experience any problems.

## License

This project is licensed under the MIT License.
