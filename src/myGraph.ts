import { DirectedGraph } from 'typescript-graph';
type Edge = 1 | 0;

export class MyGraph<T> extends DirectedGraph<T> {
    addPairs(parent:T, child:T) {
        if (this.nodes.get(this.nodeIdentity(parent)) === undefined) {
            this.insert(parent);
        }
        if (this.nodes.get(this.nodeIdentity(child)) === undefined) {
            this.insert(child);
        }
        this.addEdge(this.nodeIdentity(parent), this.nodeIdentity(child));
    }

    getRoots():T[] {
        let rootNodeIdentities : T[] = [];
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
                rootNodeIdentities.push(this.getNodeFromId(nodes[i])!);
            }
        }
        return rootNodeIdentities;
    }

    getChildren(nodeIdentity:string): T[] {
        let childrenNodeIdentities : T[] = [];
        const nodes = Array.from(this.nodes.keys());
        const nodeIndex = nodes.indexOf(nodeIdentity);
        const len = this.nodes.size;
        for (let i = 0; i < len; i++) {
            if (this.adjacency[nodeIndex][i]===1) {
                childrenNodeIdentities.push(this.getNodeFromId(nodes[i])!);
            }
        }
        return childrenNodeIdentities;
    }

    getNodeFromId(nodeIdentity:string):T|undefined {
        return this.nodes.get(nodeIdentity);
    }

}