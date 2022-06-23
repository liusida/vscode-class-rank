import * as vscode from 'vscode';
import * as path from 'path';

// My customized base class of TreeItem
export class MyItem extends vscode.TreeItem {
    type : string;
    constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState) {
        super(label, collapsibleState);
        this.type = '';
    }
}

export class SourceCodeClass extends MyItem {
    constructor(className: string, refCount: number | undefined) {
        if (!refCount) {
            refCount = 0;
        }
        super(className, vscode.TreeItemCollapsibleState.Collapsed);
        this.type = 'class';
        this.description = `(${refCount})`;
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
        };
    }

}


export class SourceCodeReference extends MyItem {
    constructor(refPath: string) {
        super(refPath, vscode.TreeItemCollapsibleState.None);
        this.type = 'ref';
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'boolean.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'boolean.svg')
        };
    }


}

