import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {MyTreeItem, SourceCodeReference, SourceCodeClass} from './myTreeItem';
import {Utils} from './utils';


interface IRefCountDictionary {
    [key: string]: number;
}
interface IRefCountList {
    [key: string]: [string];
}
interface IParentClass {
    [key: string]: [string];
}
export class ClassRankDataProvider implements vscode.TreeDataProvider<MyTreeItem> {
    // Map < className, refCount >
    private _dataRefCount : Map<string, number> = new Map<string, number>();
    // Map < className, refList >
    private _dataRefList : Map<string, [string]> = new Map<string, [string]>();
    private _dataParentClass : Map<string, string> = new Map<string, string>();

    private _canceled : boolean = false;
    private _cacheFilenamePrefix : string = ".CLASSRANK.DATA.";

    private _onDidChangeTreeData: vscode.EventEmitter<MyTreeItem | undefined | null | void> = new vscode.EventEmitter<MyTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<MyTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;


	constructor() {
	}

	getTreeItem(element: MyTreeItem): vscode.TreeItem {
        if (element.type==="ref") {
            let e = element as SourceCodeReference;
            e.command = {
                command: 'classRank.openRef',
				title: '',
				arguments: [e._refPath, e.className]
            };
            return e;
        }
		return element;
	}

	getChildren(element?: MyTreeItem): Thenable<MyTreeItem[]> {
        console.log(`getChildren of ${element}, read classes from the cache file.`);
        console.log("If the cache file doesn't exists, ask for permision to create one.");

		if (element) {
            console.log(`We are getting children for ${element.className}`);
            let ret = [];
            let list = this._dataRefList.get(element.className);
            if (list) {
                for (let refPath of list) {
                    ret.push(new SourceCodeReference(element.className, refPath));
                }
            }
            return Promise.resolve(ret);
		} else {
            //root
            console.log("if element is undefined, then we are getting children for the root");

            const mapSorted = new Map([...this._dataRefCount.entries()].sort((a, b) => b[1] - a[1]));

            let ret = [];
            for (let [className, refCount] of mapSorted) {
                ret.push(new SourceCodeClass(className, refCount, this._dataParentClass.get(className)!));
            }
            return Promise.resolve(ret);
		}
	}

    refresh(force? : boolean | undefined) {
        console.log("Refresh start.");

        // clear the memory
        this._dataRefCount = new Map<string, number>();
        this._dataRefList =  new Map<string, [string]>();
        this._dataParentClass =  new Map<string, string>();


        if (!force) {
            // if not forced, try load from cache first
            if (this.loadFromCache()) {
                // if load from cache succeed, simply leave.
                return;
            }
        }

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Scanning all files",
            cancellable: true
        }, async (progress, token) => {
            
            // Deal with the "Cancel" button.
            this._canceled = false;
            token.onCancellationRequested(() => {
                console.log("User canceled the long running operation");
                this._canceled = true; 
            });

            progress.report({ increment: 0 , message: "Please wait..."});

            //TODO: need to come up with the right RegEx pattern!!!!
            // I didn't consider:
            // (1) : protected or : private,
            // (2) ClassName final : 
            // (3) class ClassName
            // etc...
            // Maybe I should get a C++ parser.
            let classNamePattern = /\n\s*class\s+[A-Z_]*_API\s+([a-zA-Z0-9_]+)\s+:\s+public\s+([a-zA-Z0-9_]+)/g;
            let classNamePatternItem = /\n\s*class\s+[A-Z_]*_API\s+([a-zA-Z0-9_]+)\s+:\s+public\s+([a-zA-Z0-9_]+)/;
            let sourceFileNamePattern = '**/*.{c,h,cpp,hpp}';
            let excludeFileNamePattern = '**/{Intermediate/**,*.gen.*}';
            const allFileNames = await vscode.workspace.findFiles(sourceFileNamePattern, excludeFileNamePattern);
            allFileNames.sort();

            let allFileContentInMemory = [];
            for (const headerFile of allFileNames) {
                let fileContent = fs.readFileSync(headerFile.fsPath, 'utf-8');
                allFileContentInMemory.push(fileContent);

                let matches = fileContent.match(classNamePattern);
                if (matches) {
                    for (let m of matches) {
                        let singleLineMatches = m.match(classNamePatternItem);
                        if (singleLineMatches) {
                            this._dataRefCount.set(singleLineMatches[1], 0);
                            this._dataParentClass.set(singleLineMatches[1], singleLineMatches[2]);
                        }
                    }
                }
            }
            
            progress.report({increment: 0, message: `${allFileNames.length} files read to memory. ${this._dataRefCount.size} classes found. Start searching references...`});
            await Utils.delay(10);

            console.log(`allFileContentInMemory.length = ${allFileContentInMemory.length}`);
            let hitCount = 0;
            let fileProcessed = 0;
            for (const index in allFileContentInMemory) {
                const fileContent = allFileContentInMemory[index];
                const filename = allFileNames[index];
                // for each file, check all possible classes.
                // TODO: should we bundle the search, like search 50 class names at a time? will that save time?
                for (const className of this._dataRefCount.keys()) {
                    let r = new RegExp(`[^a-zA-Z0-9](${className})[^a-zA-Z0-9]`);
                    let m = fileContent.match(r);
                    if (m) {
                        hitCount++;
                        const list = this._dataRefList.get(className);
                        if (list) {
                            list!.push(filename.fsPath);
                        } else {
                            this._dataRefList.set(className, [filename.fsPath]);
                        }
                        this._dataRefCount.set(className, this._dataRefCount.get(className)!+1);
                    }    
                }

                fileProcessed++;
                const reportEverySteps = 500;
                if (fileProcessed%reportEverySteps===0) {
                    const percentage = Math.floor(100 * reportEverySteps / allFileNames.length); // I'm not sure how the increment should be calculate, I thought it was percentage finished, it turns out to be percentage of each step.

                    console.log(`${fileProcessed} / ${allFileNames.length} files scanned. ${hitCount} hit.`);
                    progress.report({increment: percentage, message: `${fileProcessed} / ${allFileNames.length} files scanned. ${hitCount} hit.` });
                    await Utils.delay(10);
                }

                if (this._canceled) {
                    console.log("Canceled by user.");
                    return;
                }
            }

            this._onDidChangeTreeData.fire();
            console.log("Refreshed. All classes loaded.");
    
            this.saveToCache();
            return;
        });
    }

    saveToCache() {

        let content =  JSON.stringify(Object.fromEntries(this._dataRefCount));
        fs.writeFileSync(this._cacheFilenamePrefix + "RefCount", content);
        console.log(`Write to ${path.resolve(__dirname, this._cacheFilenamePrefix + "RefCount")}`);

        content =  JSON.stringify(Object.fromEntries(this._dataRefList));
        fs.writeFileSync(this._cacheFilenamePrefix + "RefList", content);
        console.log(`Write to ${path.resolve(__dirname, this._cacheFilenamePrefix + "RefList")}`);

        content =  JSON.stringify(Object.fromEntries(this._dataParentClass));
        fs.writeFileSync(this._cacheFilenamePrefix + "ParentClass", content);
        console.log(`Write to ${path.resolve(__dirname, this._cacheFilenamePrefix + "ParentClass")}`);

    }
    loadFromCache() : boolean {
        if(fs.existsSync(this._cacheFilenamePrefix + "RefCount") &&
           fs.existsSync(this._cacheFilenamePrefix + "RefList") &&
           fs.existsSync(this._cacheFilenamePrefix + "ParentClass")
           ) {
            // Check that the file exists locally
            console.log("Read from cache file.");

            let cacheRefCount = JSON.parse(fs.readFileSync(this._cacheFilenamePrefix + "RefCount").toString());
            for (var value in cacheRefCount) {  
                this._dataRefCount.set(value, cacheRefCount[value]);
            }

            let cacheRefList = JSON.parse(fs.readFileSync(this._cacheFilenamePrefix + "RefList").toString());
            for (var value in cacheRefList) {  
                this._dataRefList.set(value, cacheRefList[value]);
            }

            let cacheParentClass = JSON.parse(fs.readFileSync(this._cacheFilenamePrefix + "ParentClass").toString());
            for (var value in cacheParentClass) {  
                this._dataParentClass.set(value, cacheParentClass[value]);
            }

            this._onDidChangeTreeData.fire();
            return true;
        } else {
            console.log("File not found");
            return false;
        }
    }
}

//TODO: clean console.log