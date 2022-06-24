import * as vscode from 'vscode';
import {ClassRankDataProvider} from './classRankDataProvider';
import { FilterProvider } from './filterProvider';


export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "classrank" is now active!');

	const dataProvider = new ClassRankDataProvider();
	vscode.window.registerTreeDataProvider('classesView', dataProvider);
	try {
		dataProvider.refresh();
	} catch(err) {
		console.log("Error in dataProvider.refresh()");
	}

	context.subscriptions.push(
		vscode.commands.registerCommand('classRank.refreshEntry', () => {
			try {
				dataProvider.refresh(true);
			} catch(err) {
				console.log("Error in dataProvider.refresh()");
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('classRank.openRef', (args) => {
			vscode.commands.executeCommand('vscode.open', vscode.Uri.file(args));
			console.log("Helo");
			console.log(args);
		})
	);

}

export function deactivate() {}
