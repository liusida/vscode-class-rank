import * as vscode from 'vscode';
import * as path from 'path';

// My customized base class of TreeItem
export class MyItem extends vscode.TreeItem {
    public className : string = "";
    public type : string;
    constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState) {
        super(label, collapsibleState);
        this.type = '';
    }
}

export class SourceCodeClass extends MyItem {
    constructor(className: string, refCount: number | undefined) {
        super(className, vscode.TreeItemCollapsibleState.Collapsed);
        this.className = className;
        if (!refCount) {
            refCount = 0;
        }
        this.type = 'class';
        this.description = `(${refCount})`;
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
        };
    }

}


export class SourceCodeReference extends MyItem {
    public _refPath: string = "";
    constructor(refPath: string) {
        super(refPath, vscode.TreeItemCollapsibleState.None);
        this.type = 'ref';
        this._refPath = refPath;
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'boolean.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'boolean.svg')
        };
    }


}

