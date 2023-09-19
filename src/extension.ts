import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	const config = vscode.workspace.getConfiguration('headerComment');
    const authorName = config.get<string>('authorName');
    const authorEmail = config.get<string>('authorEmail');

	const formatDate = (date: Date): string => {
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();
	
		return `${day}.${month}.${year}`;
	};
	

    const addOrUpdateHeaderComment = (document: vscode.TextDocument) => {
        const content = document.getText();
        const headerPattern = /\/\*\*\s*\n \* @file: .+\s*\n \* @author: .+<.+>\s*\n \* Date: \d{2}\.\d{2}\.\d{4}\s*\n \* Last Modified Date: \d{2}\.\d{2}\.\d{4}\s*\n \* Last Modified By: .+<.+>\s*\n \*\//;

        // If exists comment lines then update comments
        if (content.match(headerPattern)) {
			const lastModifiedDatePattern = /Last Modified Date: \d{2}\.\d{2}\.\d{4}/;
			const newLastModifiedDate = `Last Modified Date: ${formatDate(new Date())}`;
	
			const lastModifiedByPattern = /Last Modified By: .+<.+>/;
			const newLastModifiedBy = `Last Modified By: ${authorName} <${authorEmail}>`;

			const edit = new vscode.WorkspaceEdit();

            if (content.includes('Last Modified Date:') && content.match(lastModifiedDatePattern)) {
				const range = new vscode.Range(document.positionAt(content.search(lastModifiedDatePattern)), document.positionAt(content.search(lastModifiedDatePattern) + newLastModifiedDate.length));
				edit.replace(document.uri, range, newLastModifiedDate);
			}
	
			if (content.includes('Last Modified By:') && content.match(lastModifiedByPattern)) {
				const range = new vscode.Range(document.positionAt(content.search(lastModifiedByPattern)), document.positionAt(content.search(lastModifiedByPattern) + newLastModifiedBy.length));
				edit.replace(document.uri, range, newLastModifiedBy);
			}

			vscode.workspace.applyEdit(edit);
        }	else {
			// If not exists comment lines then generate comment lines
            const newHeaderContent = `/**
 * @file: ${document.fileName.split('/').pop()}
 * @author: ${authorName} <${authorEmail}>
 * Date: ${formatDate(new Date())}
 * Last Modified Date: ${formatDate(new Date())}
 * Last Modified By: ${authorName} <${authorEmail}>
 */
${content}`;

            const edit = new vscode.WorkspaceEdit();
            const range = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(document.lineCount, 0));
            edit.replace(document.uri, range, newHeaderContent);
            vscode.workspace.applyEdit(edit);
        }
    };

    context.subscriptions.push(vscode.commands.registerCommand('auto-header-vscode.addHeaderComment', () => {
        const document = vscode.window.activeTextEditor?.document;
        if (!document) {
            vscode.window.showWarningMessage('At least one file must be open!');
            return;
        }
        addOrUpdateHeaderComment(document);
    }));
}
