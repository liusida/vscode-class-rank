import * as vscode from 'vscode';
import {ClassRankDataProvider} from './classRankDataProvider';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "classrank" is now active!');

	let rootPaths : Array<string> = [];
	if (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0)) {
		rootPaths.push(vscode.workspace.workspaceFolders[0].uri.fsPath);

	}
	console.log(rootPaths);

	// just analyze rootPath for now.
	// later we can add other paths from settings.

	const dataProvider = new ClassRankDataProvider(rootPaths);
	vscode.window.registerTreeDataProvider('classesView', dataProvider);

	vscode.commands.registerCommand('classRank.refreshEntry', () => dataProvider.refresh());


}

export function deactivate() {}
