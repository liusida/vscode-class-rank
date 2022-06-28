import * as fs from 'fs';
import * as path from 'path';

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

        let content =  JSON.stringify(Object.fromEntries(this._dataRefCount));
        fs.writeFileSync(this._cacheFilenamePrefix + "RefCount", content);
        console.log(`Write to ${path.resolve(__dirname, this._cacheFilenamePrefix + "RefCount")}`);

        content =  JSON.stringify(Object.fromEntries(this._dataRefList));
        fs.writeFileSync(this._cacheFilenamePrefix + "RefList", content);
        console.log(`Write to ${path.resolve(__dirname, this._cacheFilenamePrefix + "RefList")}`);

        content =  JSON.stringify(Object.fromEntries(this._dataParentClass));
        fs.writeFileSync(this._cacheFilenamePrefix + "ParentClass", content);
        console.log(`Write to ${path.resolve(__dirname, this._cacheFilenamePrefix + "ParentClass")}`);

        content =  JSON.stringify(Object.fromEntries(this._dataHeaderFile));
        fs.writeFileSync(this._cacheFilenamePrefix + "HeaderFile", content);
        console.log(`Write to ${path.resolve(__dirname, this._cacheFilenamePrefix + "HeaderFile")}`);

        content =  JSON.stringify(Object.fromEntries(this._dataHeaderFileQuote));
        fs.writeFileSync(this._cacheFilenamePrefix + "HeaderFileQuote", content);
        console.log(`Write to ${path.resolve(__dirname, this._cacheFilenamePrefix + "HeaderFileQuote")}`);
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

            let cacheHeaderFile = JSON.parse(fs.readFileSync(this._cacheFilenamePrefix + "HeaderFile").toString());
            for (var value in cacheHeaderFile) {  
                this._dataHeaderFile.set(value, cacheHeaderFile[value]);
            }

            let cacheHeaderFileQuote = JSON.parse(fs.readFileSync(this._cacheFilenamePrefix + "HeaderFileQuote").toString());
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