import * as vscode from "vscode";
import * as common from "../extension";

export function activate(context: vscode.ExtensionContext) {
  common.activate(context);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "logyouview.parseOutput",
      () => {
        vscode.window.showErrorMessage('Cannot parse a command output in Visual Studio code Web');
      },
      null
    )
  );
}

export function deactivate() {
  common.deactivate();
}