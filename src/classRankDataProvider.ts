import * as vscode from 'vscode';
import * as fs from 'fs';
import {MyTreeItem, SourceCodeReference, SourceCodeClass} from './myTreeItem';
import {DataBackend} from './dataBackend';
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
    private dataBackend:DataBackend;
    private _canceled : boolean = false;

    private _onDidChangeTreeData: vscode.EventEmitter<MyTreeItem | undefined | null | void> = new vscode.EventEmitter<MyTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<MyTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;


	constructor(backend?: DataBackend | undefined) {
        if (backend) {
            this.dataBackend = backend;
        } else {
            this.dataBackend = new DataBackend();
        }
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
            let list = this.dataBackend._dataRefList.get(element.className);
            if (list) {
                for (let refPath of list) {
                    ret.push(new SourceCodeReference(element.className, refPath));
                }
            }
            return Promise.resolve(ret);
		} else {
            //root
            console.log("if element is undefined, then we are getting children for the root");

            const mapSorted = new Map([...this.dataBackend._dataRefCount.entries()].sort((a, b) => b[1] - a[1]));

            let ret = [];
            for (let [className, refCount] of mapSorted) {
                ret.push(new SourceCodeClass(className, refCount, 
                        this.dataBackend._dataParentClass.get(className)!, 
                        this.dataBackend._dataHeaderFile.get(className)!,
                        this.dataBackend._dataHeaderFileQuote.get(className)!
                        ));
            }
            return Promise.resolve(ret);
		}
	}
    
    getDataBackend():DataBackend {
        return this.dataBackend;
    }
    
    async refresh(force? : boolean | undefined) {
        console.log("Refresh start.");

        // clear the memory
        this.dataBackend._dataRefCount = new Map<string, number>();
        this.dataBackend._dataRefList =  new Map<string, [string]>();
        this.dataBackend._dataParentClass =  new Map<string, string>();
        this.dataBackend._dataHeaderFile = new Map<string, string>();


        if (!force) {
            // if not forced, try load from cache first
            if (this.dataBackend.loadFromCache()) {
                // if load from cache succeed, simply leave.
                return;
            }
        }

        await vscode.window.withProgress({
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

            let classNamePattern = RegExp( vscode.workspace.getConfiguration("classrank.general").get("regexp", ""), "g");
            let classNamePatternItem = RegExp( vscode.workspace.getConfiguration("classrank.general").get("regexp", ""));
            let includeFileNamePattern = vscode.workspace.getConfiguration("classrank.general.findFile").get("includeFileNamePattern", "*.*");
            let excludeFileNamePattern = vscode.workspace.getConfiguration("classrank.general.findFile").get("excludeFileNamePattern", undefined);
            const allFileNames = await vscode.workspace.findFiles(includeFileNamePattern, excludeFileNamePattern);
            allFileNames.sort();

            let allFileContentInMemory = [];
            let allFilenameInMemory = [];
            for (const headerFile of allFileNames) {
                let fileContent = fs.readFileSync(headerFile.fsPath, 'utf-8');
                allFileContentInMemory.push(fileContent);
                allFilenameInMemory.push(headerFile.fsPath);

                let matches = fileContent.match(classNamePattern);
                if (matches) {
                    for (let m of matches) {
                        let singleLineMatches = m.match(classNamePatternItem);
                        if (singleLineMatches) {
                            this.dataBackend._dataRefCount.set(singleLineMatches[1], 0);
                            this.dataBackend._dataParentClass.set(singleLineMatches[1], singleLineMatches[2]);
                            this.dataBackend._dataHeaderFile.set(singleLineMatches[1], headerFile.fsPath);
                            this.dataBackend._dataHeaderFileQuote.set(singleLineMatches[1], singleLineMatches[0]);
                        }
                    }
                }
            }
            
            progress.report({increment: 0, message: `${allFileNames.length} files read to memory. ${this.dataBackend._dataRefCount.size} classes found. Start searching references...`});
            await Utils.delay(10);

            console.log(`allFileContentInMemory.length = ${allFileContentInMemory.length}`);
            let hitCount = 0;
            // const allClassNames = Array.from(this.dataBackend._dataRefCount.keys());
            const start = new Date().getTime();
            let method = 3;
            //TODO: pick a faster scan method.
            if (method===1) {
                // slow method but straightfwd. saved here for confirmation.
                let fileProcessed = 0;
                for (const index in allFileContentInMemory) {
                    for (const className of this.dataBackend._dataRefCount.keys()) {
                        let r = new RegExp(`[^a-zA-Z0-9](${className})[^a-zA-Z0-9]`);
                        if (r.test(allFileContentInMemory[index])) {
                            const filename = allFileNames[index];
                            hitCount++;
                            const list = this.dataBackend._dataRefList.get(className);
                            if (list) {
                                list!.push(filename.fsPath);
                            } else {
                                this.dataBackend._dataRefList.set(className, [filename.fsPath]);
                            }
                            this.dataBackend._dataRefCount.set(className, this.dataBackend._dataRefCount.get(className)!+1);
                        }    
                    }

                    fileProcessed++;
                    const reportEverySteps = 100;
                    if (fileProcessed%reportEverySteps===0) {
                        let elapsed = new Date().getTime() - start;
                        const percentage = 100 * reportEverySteps / allFileNames.length; // I'm not sure how the increment should be calculate, I thought it was percentage finished, it turns out to be percentage of each step.

                        console.log(`${(elapsed/60000).toFixed(2)} minutes past. ${fileProcessed} / ${allFileNames.length} classes scanned. ${hitCount} hit.`);
                        progress.report({increment: percentage, message: `${fileProcessed} / ${allFileNames.length} classes scanned. ${hitCount} hit.` });
                        await Utils.delay(10);
                    }

                    if (this._canceled) {
                        console.log("Canceled by user.");
                        return;
                    }
                }
            } else if (method===2) {
                let classProcessed = 0;
                for (const className of this.dataBackend._dataRefCount.keys()) {
                    let r = new RegExp(`[^a-zA-Z0-9](${className})[^a-zA-Z0-9]`);
                    for (const index in allFileContentInMemory) {
                        if (r.test(allFileContentInMemory[index])) {
                            const filename = allFileNames[index];
                            hitCount++;
                            const list = this.dataBackend._dataRefList.get(className);
                            if (list) {
                                list!.push(filename.fsPath);
                            } else {
                                this.dataBackend._dataRefList.set(className, [filename.fsPath]);
                            }
                            this.dataBackend._dataRefCount.set(className, this.dataBackend._dataRefCount.get(className)!+1);
                        }    
                    }

                    classProcessed++;
                    const reportEverySteps = 100;
                    if (classProcessed%reportEverySteps===0) {
                        let elapsed = new Date().getTime() - start;
                        const percentage = 100 * reportEverySteps / this.dataBackend._dataRefCount.size; // I'm not sure how the increment should be calculate, I thought it was percentage finished, it turns out to be percentage of each step.

                        console.log(`${(elapsed/60000).toFixed(2)} minutes past. ${classProcessed} / ${this.dataBackend._dataRefCount.size} classes scanned. ${hitCount} hit.`);
                        progress.report({increment: percentage, message: `${classProcessed} / ${this.dataBackend._dataRefCount.size} classes scanned. ${hitCount} hit.` });
                        await Utils.delay(10);
                    }

                    if (this._canceled) {
                        console.log("Canceled by user.");
                        return;
                    }
                }
            } else if (method===3) {
                const bundleSize = 20;
                let classProcessed = 0;
                let bundleIndex = 0;
                let bundleClassNames : string[] = [];
                const allClassNames = Array.from(this.dataBackend._dataRefCount.keys());
                for (const className of allClassNames) {
                    bundleClassNames.push(className);
                    if (bundleIndex>bundleSize || classProcessed===allClassNames.length-1) {
                        let pattern = '';
                        for (let i=0;i<bundleClassNames.length;i++) {
                            pattern += bundleClassNames[i] + '|';
                        }
                        pattern = pattern.slice(undefined, pattern.length-1);

                        let bundleRegexp = new RegExp(`[^a-zA-Z0-9](?:${pattern})[^a-zA-Z0-9]`);
    
                        for (const index in allFileContentInMemory) {
                            if (bundleRegexp.test(allFileContentInMemory[index])) {
    
                                for (const inBundleClassName of bundleClassNames) {
                                    let regexp = new RegExp(`[^a-zA-Z0-9](${inBundleClassName})[^a-zA-Z0-9]`);
                                    if (regexp.test(allFileContentInMemory[index])) {
                                        const filename = allFilenameInMemory[index];
                                        hitCount++;
                                        const list = this.dataBackend._dataRefList.get(inBundleClassName);
                                        if (list!==undefined) {
                                            list.push(filename);
                                        } else {
                                            this.dataBackend._dataRefList.set(inBundleClassName, [filename]);
                                        }
                                        this.dataBackend._dataRefCount.set(inBundleClassName, this.dataBackend._dataRefCount.get(inBundleClassName)!+1);
                                    }
                                }
    
                                
                            }
                        }
                        bundleIndex = 0;
                        bundleClassNames = [];
                        

                    }
                    bundleIndex++;

                    classProcessed++;
                    const reportEverySteps = 500;
                    if (classProcessed%reportEverySteps===0) {
                        let elapsed = new Date().getTime() - start;
                        const percentage = 100 * reportEverySteps / this.dataBackend._dataRefCount.size; // I'm not sure how the increment should be calculate, I thought it was percentage finished, it turns out to be percentage of each step.

                        console.log(`${(elapsed/60000).toFixed(2)} minutes past. ${classProcessed} / ${this.dataBackend._dataRefCount.size} classes scanned. ${hitCount} hit.`);
                        progress.report({increment: percentage, message: `${classProcessed} / ${this.dataBackend._dataRefCount.size} classes scanned. ${hitCount} hit.` });
                        await Utils.delay(10);
                    }

                    if (this._canceled) {
                        console.log("Canceled by user.");
                        return;
                    }
                    
                }

                this._onDidChangeTreeData.fire();
                console.log("Refreshed. All classes loaded.");
        
                this.dataBackend.saveToCache();
                return;
            }
        });
    }

}

//TODO: clean console.log