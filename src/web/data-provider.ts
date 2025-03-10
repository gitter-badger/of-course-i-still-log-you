import { Uri } from "vscode";
import { Buffer } from "buffer";
import * as vscode from "vscode";
import { LogColoringRule } from "./rule";

export class OfCourseIStillLogYouTreeDataProvider
  implements vscode.TreeDataProvider<LogColoringRule>
{
  /**
   * Turns a rule on or off, then informs the update
   * @param rule Rule to toggle
   */
  toggleDisabled(rule: LogColoringRule) {
    rule.disabled = !rule.disabled;
    this.saveToDisk().then(() => {
      this.refresh();
      this.onRefresh();
    });
    rule.update();
  }

  /**
   * Removes a rule, then informs the update
   * @param rule Rule to toggle
   */
  deleteRule(rule: LogColoringRule) {
    this.rules.splice(this.rules.indexOf(rule), 1);
    this.saveToDisk().then(() => {
      this.refresh();
      this.onRefresh();
    });
  }
  lastId = 1;
  onRefresh: () => void = () => {};

  addNewEntry() {
    let rule = new LogColoringRule(
      // yeah, we're using an ID
      (++this.lastId).toString(),
      `Rule ${this.lastId.toString()}`,
      "",
      false,
      "red",
      true,
      false,
      () => {
        this.saveToDisk();
        this.refresh();
        this.onRefresh();
      }
    );
    this.rules.push(rule);

    this.saveToDisk();
    this.refresh();
    return rule;
  }

  loadFromDisk(): Thenable<void> {
    return (async () => {
      try {
        let settingsUri = await this.getSettingsUri();

        let contents = await vscode.workspace.fs.readFile(settingsUri);
        let asJson = new TextDecoder().decode(contents);

        try {
          let rulesInSettings: {
            lastId: number;
            rules: {
              id: string;
              label: string;
              regexp: string;
              disabled?: boolean;
              tag: string;
              highlightFullLine: boolean;
              caseInsensitive: boolean;
            }[];
          } = JSON.parse(asJson);

          this.lastId = rulesInSettings.lastId;
          rulesInSettings.rules.forEach((r) => {
            this.rules.push(
              new LogColoringRule(
                r.id,
                r.label,
                r.regexp,
                r.disabled || false,
                r.tag,
                r.highlightFullLine,
                r.caseInsensitive,
                () => {
                  this.saveToDisk();
                  this.refresh();
                  this.onRefresh();
                }
              )
            );
          });
        } finally {
          this.refresh();
        }
      } catch (e) {}
    })();
  }

  saveToDisk(): Thenable<void> {
    if (this.context.storageUri !== undefined) {
      return (async () => {
        let settingsUri = await this.getSettingsUri();

        await vscode.workspace.fs.writeFile(
          settingsUri,
          Buffer.from(
            JSON.stringify(
              {
                lastId: this.lastId,
                rules: this.rules.map((r) => ({
                  id: r.id,
                  regexp: r.regexp,
                  label: r.label,
                  tag: r.tag,
                  disabled: r.disabled,
                  highlightFullLine: r.highlightFullLine,
                  caseInsensitive: r.caseInsensitive
                })),
              },
              // let's use a pretty JSON format
              // so it's easier to copy/paste/edit
              null,
              2
            ),
            "utf8"
          )
        );

        this.refresh();
      })();
    } else {
      return Promise.resolve();
    }
  }
  async getSettingsUri(): Promise<Uri> {
    let baseUri = this.context.storageUri as Uri;
    await vscode.workspace.fs.createDirectory(baseUri);
    return baseUri.with({
      path: baseUri.path + "/settings.json",
    });
  }
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }
  rules: LogColoringRule[] = [];

  private _onDidChangeTreeData: vscode.EventEmitter<
    LogColoringRule | undefined | void
  > = new vscode.EventEmitter<LogColoringRule | undefined | void>();
  onDidChangeTreeData: vscode.Event<void | LogColoringRule | undefined> =
    this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(
    element: LogColoringRule
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(
    element?: LogColoringRule
  ): vscode.ProviderResult<LogColoringRule[]> {
    return this.rules;
  }
}
