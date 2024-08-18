const vscode = require("vscode");
const { ChatGroq } = require("@langchain/groq");
const { HumanMessage, SystemMessage } = require("@langchain/core/messages");
const fs = require("fs");
const path = require("path");

let groqApiKey = null;

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
  let disposable = vscode.commands.registerCommand(
    "extension.showCodeSuggestions",
    async function () {
      if (!groqApiKey) {
        await promptForApiKey();
      }

      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const document = editor.document;
        const selection = editor.selection;
        const text = document.getText(selection);

        if (text) {
          const workspaceFolders = vscode.workspace.workspaceFolders;

          let contextFiles = "";
          if (workspaceFolders && workspaceFolders.length > 0) {
            const workspaceFolder = workspaceFolders[0].uri.fsPath;
            contextFiles = await getContextFiles(workspaceFolder);
          } else {
            vscode.window.showInformationMessage(
              "No workspace folder is open. Limited context will be used."
            );
          }

          const model = new ChatGroq({
            model: "llama3-8b-8192",
            temperature: 0,
            apiKey: groqApiKey,
          });

          const languageId = document.languageId;
          const messages = [
            new SystemMessage(
              `You're a copilot. Just correct the following code in ${languageId} and rewrite it without any explanation.Do not write for exmaple, Here's corrected code or anything or do not type in any back text`
            ),
            new HumanMessage(`Context from other files:\n${contextFiles}`),
            new HumanMessage(text),
          ];

          try {
            const response = await model.invoke(messages);
            const suggestion = response.content || "No suggestion available";

            const panel = vscode.window.createWebviewPanel(
              "codeSuggestions",
              "Code Suggestions",
              vscode.ViewColumn.Beside,
              {
                enableScripts: true,
              }
            );

            panel.webview.html = getWebviewContent(suggestion);

            panel.webview.onDidReceiveMessage(
              async (message) => {
                if (message.command === "askQuestion") {
                  const question = message.text;

                  const queryMessages = [
                    new SystemMessage(
                      `You are a code assistant. Provide answers or clarifications for the following code suggestion.`
                    ),
                    new HumanMessage(
                      `Code suggestion:\n${suggestion}\n\nQuestion:\n${question}`
                    ),
                  ];

                  try {
                    const answerResponse = await model.invoke(queryMessages);
                    const answer =
                      answerResponse.content || "No answer available";
                    panel.webview.postMessage({
                      command: "displayAnswer",
                      text: answer,
                    });
                  } catch (error) {
                    console.error("Error querying Groq API:", error);
                    panel.webview.postMessage({
                      command: "displayAnswer",
                      text: `Error: ${error.message}`,
                    });
                  }
                } else if (message.command === "replaceCode") {
                  const edit = new vscode.WorkspaceEdit();
                  edit.replace(document.uri, selection, suggestion.toString());
                  await vscode.workspace.applyEdit(edit);
                  vscode.window.showInformationMessage(
                    "Code replaced with suggestion."
                  );
                } else if (message.command === "toggleDarkMode") {
                  const isDarkMode = message.isDarkMode;
                  panel.webview.postMessage({
                    command: "updateTheme",
                    isDarkMode,
                  });
                }
              },
              undefined,
              context.subscriptions
            );
          } catch (error) {
            console.error("Error calling Groq API:", error);
            vscode.window.showErrorMessage(
              `Error fetching suggestion: ${error.message}`
            );
          }
        } else {
          vscode.window.showInformationMessage("No code selected.");
        }
      } else {
        vscode.window.showInformationMessage("No active text editor.");
      }
    }
  );

  context.subscriptions.push(disposable);
}

async function promptForApiKey() {
  const apiKey = await vscode.window.showInputBox({
    placeHolder: "Enter your Groq API Key",
    prompt: "API Key required for LangChain model",
    ignoreFocusOut: true,
  });

  if (apiKey) {
    groqApiKey = apiKey;
  } else {
    vscode.window.showErrorMessage(
      "API Key is required for fetching suggestions."
    );
  }
}

async function getContextFiles(folderPath) {
  const contextFiles = [];
  const fileExtensions = [".py", ".js", ".ts"];

  const readFiles = async (dir) => {
    const files = await fs.promises.readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.promises.stat(filePath);
      if (stat.isDirectory() && file !== "node_modules") {
        await readFiles(filePath);
      } else if (fileExtensions.includes(path.extname(file))) {
        const content = await fs.promises.readFile(filePath, "utf8");
        contextFiles.push(`File: ${file}\n${content}`);
      }
    }
  };

  await readFiles(folderPath);
  return contextFiles.join("\n\n");
}

function getWebviewContent(suggestion) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Groq Copilot</title>
    <style>
        @import url("https://fonts.googleapis.com/css2?family=Montserrat&display=swap");

        * {box-sizing: border-box;}

        body {
            font-family: "Montserrat", sans-serif;
            background-color: #fff;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            text-align: center;
            min-height: 100vh;
            margin: 0;
            transition: background 0.2s linear;
        }

        body.dark {
            background-color: #292c35;
        }

        body.dark h1, body.dark #suggestion, body.dark #question, body.dark .Btn-Container, body.dark #answer {
            color: #fff;
        }

        h1 {
            margin: 20px 0;
            font-weight: bold;
            display: flex;
            justify-content: center;
            width: 100%;
        }

        #container {
            width: 100%;
            max-width: 800px;
            margin: 20px;
        }

        #suggestion {
            border: 1px solid #e0e0e0;
            padding: 15px;
            white-space: pre-wrap;
            overflow-wrap: break-word;
            text-align: left;
            background-color: #f7f7f7;
            margin-bottom: 20px;
            color: #e06c75; /* Red color similar to ChatGPT code highlights */
            font-family: 'Courier New', Courier, monospace;
            font-size: 14px;
            border-radius: 5px;
            box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
        }

        body.dark #suggestion {
            border-color: #444;
            background-color: #2e2e2e;
            color: #e06c75; /* Red color similar to ChatGPT code highlights in dark mode */
        }

        #question {
            border: 1px solid #e0e0e0;
            padding: 10px;
            background-color: #fff;
            color: #333;
            margin-bottom: 20px;
            font-weight: bold;
        }

        body.dark #question {
            border-color: #444;
            background-color: #333;
            color: #ddd;
        }

        #answer {
            border: 1px solid #e0e0e0;
            padding: 10px;
            background-color: #fff;
            color: #000;
            margin-top: 20px;
            font-family: Courier New, Courier, monospace;
        }

        body.dark #answer {
            border-color: #444;
            background-color: #333;
            color: #ddd;
        }

        .Btn-Container {
            display: flex;
            width: 170px;
            height: fit-content;
            background-color: #1d2129;
            border-radius: 40px;
            box-shadow: 0px 5px 10px #bebebe;
            justify-content: space-between;
            align-items: center;
            border: none;
            cursor: pointer;
            margin: 10px;
        }

        .icon-Container {
            width: 45px;
            height: 45px;
            background-color: #f59aff;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            border: 3px solid #1d2129;
        }

        .text {
            width: calc(170px - 45px);
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.1em;
            letter-spacing: 1.2px;
        }

        .icon-Container svg {
            transition-duration: 1.5s;
        }

        .Btn-Container:hover .icon-Container svg {
            transition-duration: 1.5s;
            animation: arrow 1s linear infinite;
        }

        @keyframes arrow {
            0% {
                opacity: 0;
                margin-left: 0px;
            }
            100% {
                opacity: 1;
                margin-left: 10px;
            }
        }

        .checkbox {
            opacity: 0;
            position: absolute;
        }

        .checkbox-label {
            background-color: #111;
            width: 50px;
            height: 26px;
            border-radius: 50px;
            position: relative;
            padding: 5px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .fa-moon {
            color: #f1c40f;
        }

        .fa-sun {
            color: #f39c12;
        }

        .checkbox-label .ball {
            background-color: #fff;
            width: 22px;
            height: 22px;
            position: absolute;
            left: 2px;
            top: 2px;
            border-radius: 50%;
            transition: transform 0.2s linear;
        }

        .checkbox:checked + .checkbox-label .ball {
            transform: translateX(24px);
        }
    </style>
</head>
<body>
    <div id="container">
        <h1>Groq Copilot</h1>
        <div>
            <input type="checkbox" class="checkbox" id="checkbox">
            <label for="checkbox" class="checkbox-label">
                <i class="fas fa-moon"></i>
                <i class="fas fa-sun"></i>
                <span class="ball"></span>
            </label>
        </div>
        <div id="suggestion">
            <pre>${suggestion}</pre>
        </div>
        <textarea id="question" rows="5" placeholder="Ask a question about the suggestion..."></textarea>
        <div style="display: flex; justify-content: center; gap: 10px; line-height: 1.5;">
            <div class="Btn-Container" id="askButton">
                <div class="icon-Container">
                    <!-- Optional: Include icons here -->
                </div>
                <div class="text">Clarify</div>
            </div>
            <div class="Btn-Container" id="replaceButton">
                <div class="icon-Container">
                    <!-- Optional: Include icons here -->
                </div>
                <div class="text">Replace</div>
            </div>
        </div>
        <div id="answer"></div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/js/all.min.js"></script>
    <script>
        const vscode = acquireVsCodeApi();

        document.getElementById('askButton').addEventListener('click', () => {
            const question = document.getElementById('question').value;
            vscode.postMessage({
                command: 'askQuestion',
                text: question
            });
        });

        document.getElementById('replaceButton').addEventListener('click', () => {
            vscode.postMessage({
                command: 'replaceCode'
            });
        });

        document.getElementById('checkbox').addEventListener('change', () => {
            const isDarkMode = document.getElementById('checkbox').checked;
            document.body.classList.toggle('dark', isDarkMode);
            // Update answer text color based on mode
            document.getElementById('answer').style.color = isDarkMode ? '#ddd' : '#000';
        });

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'displayAnswer') {
                document.getElementById('answer').innerText = message.text;
                document.getElementById('answer').style.color = document.body.classList.contains('dark') ? '#ddd' : '#000'; // Ensure the text color matches the mode
                document.getElementById('answer').style.fontFamily = 'Courier New, Courier, monospace';
            }
        });
    </script>
</body>
</html>`;
}

module.exports = {
  activate,
  deactivate: function () {},
};
