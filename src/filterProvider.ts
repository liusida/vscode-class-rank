import * as vscode from "vscode";

export class FilterProvider implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView;
    _doc?: vscode.TextDocument;
    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;
    
        webviewView.webview.options = {
          // Allow scripts in the webview
          enableScripts: true,
    
          localResourceRoots: [this._extensionUri],
        };
    
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    }
    private _getHtmlForWebview(webview: vscode.Webview) {
        return `Hello, Sidebar!`;
    }
}