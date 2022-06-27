import * as vscode from 'vscode';
import * as path from 'path';

// My customized base class of TreeItem
export class MyTreeItem extends vscode.TreeItem {
    public className : string = "";
    public type : string;
    constructor(className: string, label: string, collapsibleState: vscode.TreeItemCollapsibleState) {
        super(label, collapsibleState);
        this.type = '';
        this.className = className;
    }
}

export class SourceCodeClass extends MyTreeItem {
    headerFile : string;
    constructor(className: string, refCount: number, parentClass: string, headerFile: string) {
        super(className, className, vscode.TreeItemCollapsibleState.Collapsed);
        if (!refCount) {
            refCount = 0;
        }
        this.type = 'class';
        this.description = `: ${parentClass} (${refCount})`;
        this.headerFile = headerFile;
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
        };
        this.contextValue = "class";
    }

}


export class SourceCodeReference extends MyTreeItem {
    public _refPath: string = "";
    constructor(className: string, refPath: string) {
        let strPath = '';
        if (vscode.workspace.workspaceFolders) {
            for (let folder of vscode.workspace.workspaceFolders!) {
                if (refPath.includes(folder.uri.fsPath.toString())) {
                    strPath = refPath.replace(folder.uri.fsPath.toString(), '');
                    break;
                }
            }
        }
        if (strPath==='') {
            strPath = refPath;
        }

        super(className, strPath, vscode.TreeItemCollapsibleState.None);
        this.type = 'ref';
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'boolean.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'boolean.svg')
        };

        this._refPath = refPath;

    }


}

