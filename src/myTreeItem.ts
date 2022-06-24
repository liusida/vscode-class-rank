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
    constructor(className: string, refCount: number, parentClass: string) {
        super(className, className, vscode.TreeItemCollapsibleState.Collapsed);
        if (!refCount) {
            refCount = 0;
        }
        this.type = 'class';
        this.description = `: ${parentClass} (${refCount})`;
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
        };
    }

}


export class SourceCodeReference extends MyTreeItem {
    public _refPath: string = "";
    constructor(className: string, refPath: string) {
        super(className, refPath, vscode.TreeItemCollapsibleState.None);
        this.type = 'ref';
        this._refPath = refPath;
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'boolean.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'boolean.svg')
        };
    }


}

