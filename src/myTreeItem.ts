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
    headerFileQuote: string;
    constructor(className: string, refCount: number, parentClass: string, headerFile: string, headerFileQuote: string, collapsibleState?: vscode.TreeItemCollapsibleState | undefined) {
        if (collapsibleState===undefined) {
            super(className, className, vscode.TreeItemCollapsibleState.Collapsed);
        } else {
            super(className, className, collapsibleState);
        }
        if (!refCount) {
            refCount = 0;
        }
        this.type = 'class';
        if (parentClass===undefined) {
            this.description = `(${refCount})`;
        } else {
            this.description = `: ${parentClass} (${refCount})`;
        }
        this.headerFile = headerFile;
        this.headerFileQuote = headerFileQuote;
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
        };
        // this.iconPath = vscode.ThemeIcon.File;
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
                    strPath = folder.name + refPath.replace(folder.uri.fsPath.toString(), '');
                    break;
                }
            }
        }
        if (strPath==='') {
            strPath = refPath;
        }

        super(className, strPath, vscode.TreeItemCollapsibleState.None);
        this.type = 'ref';
        this.iconPath = vscode.ThemeIcon.File;
        // this.contextValue = "file";
        this.resourceUri = vscode.Uri.file( refPath );
        this._refPath = refPath;

    }


}

