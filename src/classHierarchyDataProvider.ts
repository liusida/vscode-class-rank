import * as vscode from 'vscode';
import { MyTreeItem, SourceCodeClass } from './myTreeItem';
import { MyGraph } from './myGraph';
import {DataBackend} from './dataBackend';

type NodeType = { name: string; refCount: number };

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
        const threshold = vscode.workspace.getConfiguration("classrank.hierarchyView").get("threshold", 50);

        for (let [child, parent] of this.dataBackend._dataParentClass) {
            if (this.dataBackend._dataRefCount.get(child)! > threshold
                // && this.dataBackend._dataRefCount.get(parent)! > threshold
                ) {
                this.graph.addPairs(
                    {name: parent, refCount: this.dataBackend._dataRefCount.get(parent)!}, 
                    {name: child, refCount: this.dataBackend._dataRefCount.get(child)!}
                    );
            }
        }

        // make sure everything is connected.
        for (let [child, parent] of this.dataBackend._dataParentClass) {
            if (this.graph.getNodeFromId(child)!==undefined && this.graph.getNodeFromId(parent)!==undefined) {
                this.graph.addEdge(parent, child);
            }
        }
    }

	getTreeItem(element: MyTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: MyTreeItem): Thenable<MyTreeItem[]> {
        let ret : SourceCodeClass[] = [];
        let refCounts : Map<string, number> = new Map<string, number>();
        let nodes;
        if (element===undefined) {
            nodes = this.graph.getRoots();
        } else {
            nodes = this.graph.getChildren(element.className);
        }
        for (let node of nodes) {
            refCounts.set(node.name, node.refCount);
            let cState = vscode.TreeItemCollapsibleState.None;
            if (this.graph.getChildren(node.name).length>0) {
                cState = vscode.TreeItemCollapsibleState.Expanded;
            }
            ret.push(new SourceCodeClass(node.name, 
                        this.dataBackend._dataRefCount.get(node.name)!, 
                        this.dataBackend._dataParentClass.get(node.name)!, 
                        this.dataBackend._dataHeaderFile.get(node.name)! ,
                        this.dataBackend._dataHeaderFileQuote.get(node.name)! ,
                        cState));
        }
        ret.sort((a,b)=>{return refCounts.get(a.className)! - refCounts.get(b.className)!;}).reverse();
        return Promise.resolve(ret);
    }
}