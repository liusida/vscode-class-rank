import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class DataBackend {
    // Map < className, refCount >
    public _dataRefCount : Map<string, number> = new Map<string, number>();
    // Map < className, refList >
    public _dataRefList : Map<string, [string]> = new Map<string, [string]>();
    public _dataParentClass : Map<string, string> = new Map<string, string>();
    public _dataHeaderFile: Map<string, string> = new Map<string, string>();
    public _dataHeaderFileQuote: Map<string, string> = new Map<string, string>();

    private _cacheFilenamePrefix : string = ".CLASSRANK.DATA.";

    saveToCache() {
        let cacheFolder = vscode.workspace.getConfiguration("classrank.general").get("cacheFolder", "");
        if ( vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders?.length>0 ) {
            cacheFolder = cacheFolder.replace("${workspaceFolder}", vscode.workspace.workspaceFolders[0].uri.fsPath.toString());
        }

        let content =  JSON.stringify(Object.fromEntries(this._dataRefCount));
        let cachePath = path.join(cacheFolder, this._cacheFilenamePrefix + "RefCount");
        fs.writeFileSync(cachePath, content);
        console.log(`Write to ${cachePath}`);

        content =  JSON.stringify(Object.fromEntries(this._dataRefList));
        cachePath = path.join(cacheFolder, this._cacheFilenamePrefix + "RefList");
        fs.writeFileSync(cachePath, content);
        console.log(`Write to ${cachePath}`);

        content =  JSON.stringify(Object.fromEntries(this._dataParentClass));
        cachePath = path.join(cacheFolder, this._cacheFilenamePrefix + "ParentClass");
        fs.writeFileSync(cachePath, content);
        console.log(`Write to ${cachePath}`);

        content =  JSON.stringify(Object.fromEntries(this._dataHeaderFile));
        cachePath = path.join(cacheFolder, this._cacheFilenamePrefix + "HeaderFile");
        fs.writeFileSync(cachePath, content);
        console.log(`Write to ${cachePath}`);

        content =  JSON.stringify(Object.fromEntries(this._dataHeaderFileQuote));
        cachePath = path.join(cacheFolder, this._cacheFilenamePrefix + "HeaderFileQuote");
        fs.writeFileSync(cachePath, content);
        console.log(`Write to ${cachePath}`);
    }

    loadFromCache() : boolean {
        let cacheFolder = vscode.workspace.getConfiguration("classrank.general").get("cacheFolder", "");
        if ( vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders?.length>0 ) {
            cacheFolder = cacheFolder.replace("${workspaceFolder}", vscode.workspace.workspaceFolders[0].uri.fsPath.toString());
        }

        if(fs.existsSync(path.join(cacheFolder, this._cacheFilenamePrefix + "RefCount")) &&
           fs.existsSync(path.join(cacheFolder, this._cacheFilenamePrefix + "RefList")) &&
           fs.existsSync(path.join(cacheFolder, this._cacheFilenamePrefix + "ParentClass")) &&
           fs.existsSync(path.join(cacheFolder, this._cacheFilenamePrefix + "HeaderFile")) &&
           fs.existsSync(path.join(cacheFolder, this._cacheFilenamePrefix + "HeaderFileQuote")) 
           ) {
            // Check that the file exists locally
            console.log("Read from cache file.");

            let cachePath = path.join(cacheFolder, this._cacheFilenamePrefix + "RefCount");
            let cacheRefCount = JSON.parse(fs.readFileSync(cachePath).toString());
            for (var value in cacheRefCount) {  
                this._dataRefCount.set(value, cacheRefCount[value]);
            }

            cachePath = path.join(cacheFolder, this._cacheFilenamePrefix + "RefList");
            let cacheRefList = JSON.parse(fs.readFileSync(cachePath).toString());
            for (var value in cacheRefList) {  
                this._dataRefList.set(value, cacheRefList[value]);
            }

            cachePath = path.join(cacheFolder, this._cacheFilenamePrefix + "ParentClass");
            let cacheParentClass = JSON.parse(fs.readFileSync(cachePath).toString());
            for (var value in cacheParentClass) {  
                this._dataParentClass.set(value, cacheParentClass[value]);
            }

            cachePath = path.join(cacheFolder, this._cacheFilenamePrefix + "HeaderFile");
            let cacheHeaderFile = JSON.parse(fs.readFileSync(cachePath).toString());
            for (var value in cacheHeaderFile) {  
                this._dataHeaderFile.set(value, cacheHeaderFile[value]);
            }

            cachePath = path.join(cacheFolder, this._cacheFilenamePrefix + "HeaderFileQuote");
            let cacheHeaderFileQuote = JSON.parse(fs.readFileSync(cachePath).toString());
            for (var value in cacheHeaderFileQuote) {  
                this._dataHeaderFileQuote.set(value, cacheHeaderFileQuote[value]);
            }
            
            return true;
        } else {
            console.log("File not found");
            return false;
        }
    }    
}