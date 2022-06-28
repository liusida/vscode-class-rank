import * as vscode from 'vscode';
import { ClassHierarchyDataProvider } from './classHierarchyDataProvider';
import {ClassRankDataProvider} from './classRankDataProvider';
import { FilterProvider } from './filterProvider';


export async function activate(context: vscode.ExtensionContext) {
	

	console.log('Congratulations, your extension "classrank" is now active!');

	const dataProvider = new ClassRankDataProvider();
	vscode.window.registerTreeDataProvider('classesView', dataProvider);
	try {
		await dataProvider.refresh();
	} catch(err) {
		console.log("Error in dataProvider.refresh()");
	}
	const hierarchyDataProvider = new ClassHierarchyDataProvider(dataProvider.getDataBackend());
	vscode.window.registerTreeDataProvider('hierarchyView', hierarchyDataProvider);

	context.subscriptions.push(
		vscode.commands.registerCommand('classRank.refreshEntry', async () => {
			try {
				await dataProvider.refresh(true);
				const hierarchyDataProvider = new ClassHierarchyDataProvider(dataProvider.getDataBackend());
				vscode.window.registerTreeDataProvider('hierarchyView', hierarchyDataProvider);
			} catch(err) {
				console.log("Error in dataProvider.refresh()");
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('classRank.gotoHeaderFile', (args) => {
			vscode.window.showTextDocument(vscode.Uri.file(args.headerFile)).then(()=>{
				vscode.commands.executeCommand("editor.actions.findWithArgs", {"searchString": `${args.className} :`, "wholeWord": true, "matchCase": true}).then(()=>{
					vscode.commands.executeCommand("editor.action.nextMatchFindAction");
				});
			});
		})
	);
	

	context.subscriptions.push(
		vscode.commands.registerCommand('classRank.openRef', (argFilename, argClassName) => {
			vscode.window.showTextDocument(vscode.Uri.file(argFilename)).then(()=>{
				vscode.commands.executeCommand("editor.actions.findWithArgs", {"searchString": argClassName, "wholeWord": true, "matchCase": true}).then(()=>{
					vscode.commands.executeCommand("editor.action.nextMatchFindAction");
				});
			});
		})
	);

}

export function deactivate() {}
