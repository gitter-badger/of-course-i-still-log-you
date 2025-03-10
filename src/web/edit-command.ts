import * as vscode from "vscode";
import { Uri } from "vscode";
import { OfCourseIStillLogYouTreeDataProvider } from "./data-provider";
import { buildHtml } from "./edit-rule-html";
import { LogColoringRule } from "./rule";

export function buildEditCommand(editViewsByRule: {[key: string]: vscode.WebviewPanel}, dataProvider: OfCourseIStillLogYouTreeDataProvider, context: vscode.ExtensionContext) {
  return (rule: LogColoringRule) => {
    let existingView = editViewsByRule[rule.id];
    if (existingView !== undefined) {
      existingView.reveal(existingView.viewColumn);
    } else {
      let view = (editViewsByRule[rule.id] = vscode.window.createWebviewPanel(
        "logyoueditruleview",
        "Edit rule",
        vscode.ViewColumn.Two,
        {
          localResourceRoots: [
            Uri.joinPath(context.extensionUri, 'dist', 'web')
          ],
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      ));
      let codiconCss = view.webview.asWebviewUri(Uri.joinPath(context.extensionUri, 'dist', 'web', "codicon.css"));

      view.webview.onDidReceiveMessage((e) => {
        if (!e) {
          return;
        }

        switch (e.command) {
          case "save":
            rule.label = e.label;
            rule.regexp = e.regexp;
            rule.tag = e.selectedtag;
            rule.highlightFullLine = e.highlightFullLine;
            rule.disabled = e.disabled;
            rule.caseInsensitive = e.caseInsensitive;
            rule.update();
            break;
          case "delete":
            dataProvider.deleteRule(rule);
            view.dispose();
            break;
        }
      });

      view.onDidDispose(() => {
        delete editViewsByRule[rule.id];
      });

      view.webview.html = buildHtml(rule, codiconCss.toString());
    }
  };
}
