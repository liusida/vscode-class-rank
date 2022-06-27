export class DataBackend {
    // Map < className, refCount >
    public _dataRefCount : Map<string, number> = new Map<string, number>();
    // Map < className, refList >
    public _dataRefList : Map<string, [string]> = new Map<string, [string]>();
    public _dataParentClass : Map<string, string> = new Map<string, string>();
    public _dataHeaderFile: Map<string, string> = new Map<string, string>();
}