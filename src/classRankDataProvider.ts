import * as vscode from 'vscode';
import * as fs from 'fs';
import {MyItem, SourceCodeReference, SourceCodeClass} from './myItem';
import {Utils} from './utils';

export class ClassRankDataProvider implements vscode.TreeDataProvider<MyItem> {
    private _data : Map<string, number> = new Map<string, number>();
    private _canceled : boolean = false;
    private _onDidChangeTreeData: vscode.EventEmitter<MyItem | undefined | null | void> = new vscode.EventEmitter<MyItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<MyItem | undefined | null | void> = this._onDidChangeTreeData.event;


	constructor(private rootPaths: Array<string>) {
        console.log(`rootPaths: ${rootPaths}`);
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
            //root
            console.log("if element is undefined, then we are getting children for the root");

            const mapSorted = new Map([...this._data.entries()].sort((a, b) => b[1] - a[1]));

            let ret = [];
            for (let [className, refCount] of mapSorted) {
                ret.push(new SourceCodeClass(className, refCount));
            }
            return Promise.resolve(ret);
		}
	}

    refresh() {
        console.log("Refresh start.");

        vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Scanning all files",
			cancellable: true
		}, async (progress, token) => {
            
            this._canceled = false;

			token.onCancellationRequested(() => {
				console.log("User canceled the long running operation");
                this._canceled = true; 
			});

			progress.report({ increment: 0 , message: "Please wait..."});

            let classNamePattern = /class .*_API ([A-Z0-9]*) : public [A-Z0-9]*/i;

            const allFileNames = await vscode.workspace.findFiles('**/*.{c,h,cpp,hpp}');
            allFileNames.sort();
            let allFileContentHuge = [];

            for (const headerFile of allFileNames) {
                let fileContent = fs.readFileSync(headerFile.fsPath, 'utf-8');
                allFileContentHuge.push(fileContent);

                let m = fileContent.match(classNamePattern);
                if (m) {
                    this._data.set(m[1], 0);
                }
            }

			progress.report({increment: 0, message: `${allFileNames.length} files read to memory. Start searching references...`});
            await Utils.delay(10);

            console.log(`allFileContentHuge.length = ${allFileContentHuge.length}`);
            let hitCount = 0;
            let fileProcessed = 0;
            for (const index in allFileContentHuge) {
                const fileContent = allFileContentHuge[index];
                const filename = allFileNames[index];
                for (const className of this._data.keys()) {
                    let r = new RegExp(`[^a-zA-Z0-9](${className})[^a-zA-Z0-9]`);
                    let m = fileContent.match(r);
                    if (m) {
                        hitCount++;
                        this._data.set(className, this._data.get(className)!+1);
                    }    
                }
                fileProcessed++;
                const reportEverySteps = 500;
                if (fileProcessed%reportEverySteps===0) {
                    const percentage = Math.floor(100 * reportEverySteps / allFileNames.length);

                    console.log(`${fileProcessed} / ${allFileNames.length} files scanned. ${hitCount} hit.`);
                    progress.report({increment: percentage, message: `${fileProcessed} / ${allFileNames.length} files scanned. ${hitCount} hit.` });
                    await Utils.delay(10);
                }
                if (this._canceled) {
                    console.log("Canceled by user.");
                    return;
                }
            }
            return;
        });

        this._onDidChangeTreeData.fire();
        console.log("Refreshed. All classes loaded.");


    }
}

