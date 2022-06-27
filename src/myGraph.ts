import { DirectedGraph } from 'typescript-graph';
type Edge = 1 | 0;

export class MyGraph<T> extends DirectedGraph<T> {
    // getAdj() : Array<Array<Edge>>{
    //     return this.adjacency;
    // }

    // getChildren(parent:T): T[] {
    //     let ret : T[] = [];
    //     const parentId = Array.from(this.nodes.keys()).indexOf(parent);
    //     const nodesArray = Array.from(this.nodes.values());
    //     for (let [key,val] of this.adjacency[parentId]) {
    //         if (val===1) {
    //             ret.push(nodesArray[key]);
    //         }
    //     }

    //     return ret;
    // }

    addPairs(parent:T, child:T) {
        if (this.nodes.get(this.nodeIdentity(parent)) === undefined) {
            this.insert(parent);
        }
        if (this.nodes.get(this.nodeIdentity(child)) === undefined) {
            this.insert(child);
        }
        this.addEdge(this.nodeIdentity(parent), this.nodeIdentity(child));
    }
    getRootIds():string[] {
        let rootNodeIdentities : string[] = [];
        const nodes = Array.from(this.nodes.keys());
        const len = this.nodes.size;
        for (let i = 0; i < len; i++) {
            let dirty = false;
            for (let j = 0; j<len; j++) {
                if (this.adjacency[j][i]===1) {
                    dirty = true;
                    break;
                }
            }
            if (!dirty) {
                rootNodeIdentities.push(nodes[i]);
            }
        }
        return rootNodeIdentities;
    }

    getChildrenIds(nodeIdentity:string): string[] {
        let childrenNodeIdentities : string[] = [];
        const nodes = Array.from(this.nodes.keys());
        const nodeIndex = nodes.indexOf(nodeIdentity);
        const len = this.nodes.size;
        for (let i = 0; i < len; i++) {
            if (this.adjacency[nodeIndex][i]===1) {
                childrenNodeIdentities.push(nodes[i]);
            }
        }
        return childrenNodeIdentities;
    }
    getNodeFromId(nodeIdentity:string):T|undefined {
        return this.nodes.get(nodeIdentity);
    }

}