const vscode = require("vscode");
const { ChatGroq } = require("@langchain/groq");
const { HumanMessage, SystemMessage } = require("@langchain/core/messages");

// Manually set API keys and other configurations
const LANGCHAIN_TRACING_V2 = "true";
const GROQ_API = process.env.GROQ_API_KEY;
const LANGCHAIN_API = process.env.LANGCHAIN_API_KEY;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log(
    'Congratulations, your extension "soham-s-copilot" is now active!'
  );

  // Register the Process Code command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "soham-s-copilot.processCode",
      async function () {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          const document = editor.document;
          const selection = editor.selection;
          const text = document.getText(selection);

          if (text) {
            // Initialize the LangChain model
            const model = new ChatGroq({
              model: "llama3-8b-8192",
              temperature: 0,
              apiKey: GROQ_API, // Use the LangChain API key
            });

            const languageId = document.languageId;
            const messages = [
              new SystemMessage(
                `You're a copilot. Just correct the following code in ${languageId} and rewrite it without any explanation.`
              ),
              new HumanMessage(text),
            ];

            try {
              const response = await model.invoke(messages);

              // Extract the relevant part of the response
              console.log("API Response:", response);

              const suggestionText =
                response.text ||
                response.message ||
                "No response text available";

              // Construct the suggestion comment
              const suggestionComment = ` # ${suggestionText} (Response by llama-3)`;

              // Insert the suggestion as a comment beside the selected code
              const edit = new vscode.WorkspaceEdit();
              edit.insert(document.uri, selection.end, suggestionComment);
              await vscode.workspace.applyEdit(edit);

              vscode.window.showInformationMessage(
                "Suggestion added as a comment."
              );
            } catch (error) {
              console.error("Error invoking LangChain model:", error);
              vscode.window.showErrorMessage(
                `Failed to correct code. Error: ${error.message}`
              );
            }
          } else {
            vscode.window.showInformationMessage("No code selected.");
          }
        } else {
          vscode.window.showInformationMessage("No active editor found.");
        }
      }
    )
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
