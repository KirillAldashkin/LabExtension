import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('Activate');
	const disposable = vscode.commands.registerCommand('autobracer.mycommand', () => {
		vscode.window.showInformationMessage('My command');
	});
	context.subscriptions.push(disposable);
}

export function deactivate() {}
