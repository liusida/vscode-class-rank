import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class ClassRankDataProvider implements vscode.TreeDataProvider<MyItem> {

    private _classes : string[];
    private _onDidChangeTreeData: vscode.EventEmitter<MyItem | undefined | null | void> = new vscode.EventEmitter<MyItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<MyItem | undefined | null | void> = this._onDidChangeTreeData.event;


	constructor(private rootPaths: Array<string>) {
        console.log(`rootPaths: ${rootPaths}`);
        this._classes = [];
	}

	getTreeItem(element: MyItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: MyItem): Thenable<MyItem[]> {
        console.log(`getChildren of ${element}, read classes from the cache file.`);
        console.log("If the cache file doesn't exists, ask for permision to create one.");

		if (element) {
            console.log(`We are getting children for ${element.label}`);
            return Promise.resolve([new SourceCodeReference("path/to/filename.cpp")]);
		} else {
            console.log("if element is undefined, then we are getting children for the root");
            let ret = [];
            for (const s of this._classes) {
                ret.push(new SourceCodeClass(s, 1));
            }
            return Promise.resolve(ret);
		}
	}

    // Rebuild the cache file and reload cache file in.
    async refresh() {
        console.log("Refresh start.");
        this._classes = [];

        let pattern = /class .*_API ([A-Z0-9]*) : public [A-Z0-9]*/i;

        const headerFiles = await vscode.workspace.findFiles('**/*.h');
        for (const headerFile of headerFiles) {
            // console.log("Parsing: ");
            // console.log(headerFile.fsPath);
            let fileContent = fs.readFileSync(headerFile.fsPath, 'utf-8');
            let m = fileContent.match(pattern);
            if (m) {
                // console.log(m);
                this._classes.push(m[1]);
                
            }
            // const content = await vscode.workspace.fs.readFile(headerFile);
            // console.log(content);
            // pattern.exec(content);
            // this._classes.push(headerFile.fsPath);
            // We need to find something like this:
            // class WHATEVER AEmptyRefGameModeBase : public WhatEver
            // or
            // class WHATEVER AEmptyRefGameModeBase

            // Regex: /class .*_API [A-Z0-9]* : public [A-Z0-9]*/i
            

        }
        this._onDidChangeTreeData.fire();

        // if (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0)) {
        //     for (const folder of vscode.workspace.workspaceFolders) {
        //         console.log(`Processing ${folder.uri}`);
        //         // let p : vscode.GlobPattern = new vscode.GlobPattern();
        //         // for (const [name, type] of await vscode.workspace.fs.readDirectory(vscode.Uri.file(path.posix.dirname(rootPath)))) {
        //         //     console.log(name);
        //         // }            
        //     }
        // }
        console.log("Refreshed.");
    }
}

// My customized base class of TreeItem
class MyItem extends vscode.TreeItem {
    type : string;
    constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState) {
        super(label, collapsibleState);
        this.type = '';
    }
}

export class SourceCodeClass extends MyItem {
    constructor(className: string, refCount: number) {
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

