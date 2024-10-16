import * as vscode from 'vscode';
import { edit } from "./bracer";

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('autobracer.unbrace', () => {
		let editor = vscode.window.activeTextEditor;
		if(editor === undefined) {
			vscode.window.showErrorMessage("No file opened");
			return;
		}
		if(editor.selection.isEmpty) {
			vscode.window.showErrorMessage("Select an expression first");
			return;
		}
		let result = edit(
			editor.document.languageId,
			editor.document.getText(editor.selection)
		);
		if(!result.succeed) {
			vscode.window.showErrorMessage(result.text);
			return;
		}
		editor.edit(edit => edit.replace(editor.selection, result.text));
	});
	context.subscriptions.push(disposable);
}

export function deactivate() {}
