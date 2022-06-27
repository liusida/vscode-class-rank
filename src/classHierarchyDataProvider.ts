import * as vscode from 'vscode';
import { MyTreeItem, SourceCodeClass } from './myTreeItem';
import { MyGraph } from './myGraph';
import {DataBackend} from './dataBackend';

type NodeType = { name: string; count: number };

export class ClassHierarchyDataProvider implements vscode.TreeDataProvider<MyTreeItem> {
    dataBackend : DataBackend;
    graph: MyGraph<NodeType>;

	constructor(backend?: DataBackend | undefined) {
        if (backend) {
            this.dataBackend = backend;
        } else {
            this.dataBackend = new DataBackend();
        }

        this.graph = new MyGraph<NodeType>((n: NodeType) => n.name);

        for (let [child, parent] of this.dataBackend._dataParentClass) {
            if (this.dataBackend._dataRefCount.get(child)! > 50
                && this.dataBackend._dataRefCount.get(parent)! > 50) {
                this.graph.addPairs({name: parent, count: this.dataBackend._dataRefCount.get(parent)!}, {name: child, count: this.dataBackend._dataRefCount.get(child)!});
            }
        }
    }
    test() {
    }

	getTreeItem(element: MyTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: MyTreeItem): Thenable<MyTreeItem[]> {
        if (element === undefined) {
            // ROOT
            let ret = [];
            for (let className of this.graph.getRootIds()) {
                ret.push(new SourceCodeClass(className, 
                            this.dataBackend._dataRefCount.get(className)!, 
                            this.dataBackend._dataParentClass.get(className)!, 
                            this.dataBackend._dataHeaderFile.get(className)! ));
            }
            return Promise.resolve(ret);
        } else {
            // Node
            let ret = [];
            for (let className of this.graph.getChildrenIds(element.className)) {
                ret.push(new SourceCodeClass(className, 
                            this.dataBackend._dataRefCount.get(className)!, 
                            this.dataBackend._dataParentClass.get(className)!, 
                            this.dataBackend._dataHeaderFile.get(className)! ));
            }
            return Promise.resolve(ret);
        }
         
    }
}