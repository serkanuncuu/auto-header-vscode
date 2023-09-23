/**
 * @file: extension.ts
 * @author: Serkan UNCU <serkanuncuu@gmail.com>
 * Date: 20.09.2023
 * Last Modified Date: 23.09.2023
 * Last Modified By: Serkan UNCU <serkanuncuu@gmail.com>
 */
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

  const askForName = async () => {
    return await vscode.window.showInputBox({ prompt: 'Please enter your name:' });
  };

  const askForEmail = async () => {
    return await vscode.window.showInputBox({ prompt: 'Please enter your email:' });
  };

  const isAuthorNameSet = vscode.workspace.getConfiguration().get('headerComment.authorName');
  const isAuthorEmailSet = vscode.workspace.getConfiguration().get('headerComment.authorEmail');

  if (!isAuthorNameSet || !isAuthorEmailSet) {
    askForName().then((name) => {
      if (name) {
        askForEmail().then((email) => {
          if (email) {
            const config = vscode.workspace.getConfiguration('headerComment');
            config.update('authorName', name, vscode.ConfigurationTarget.Global);
            config.update('authorEmail', email, vscode.ConfigurationTarget.Global);
          }
        });
      }
    });
  }

  const config = vscode.workspace.getConfiguration('headerComment');
  const authorName = config.get<string>('authorName');
  const authorEmail = config.get<string>('authorEmail');

  if (!authorName || !authorEmail) {
    vscode.window.showWarningMessage('Please set author name and email in settings before using this feature. Do you want set now?',
    'Yes').then(selection => {
      if (selection === 'Yes') {
        vscode.commands.executeCommand('workbench.action.openSettings');
      }
    });
  }

  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
  };

  const addOrUpdateHeaderComment = (document: vscode.TextDocument) => {
    const content = document.getText();
    const headerPattern = /\/\*\*[\s\S]*?@file\s*.*[\s\S]*?@author\s*.*[\s\S]*?\*\//;
    const match = headerPattern.exec(content);

    const edit = new vscode.WorkspaceEdit();
    // If exists comment lines then update comments
    if (match) {
      const headerContent = match[0];
      const headerEnd = match.index + headerContent.length - 3;
      const headerLines = headerContent.split('\n');
      const headerStart = match.index;

      if (headerLines.length <= 5) {
        const startPosition = document.positionAt(headerEnd);
        const endPosition = document.positionAt(headerEnd + 3);

        const replaceRange = new vscode.Range(startPosition, endPosition);

        const newContent = ` * Last Modified Date: ${formatDate(new Date())}\n * Last Modified By: ${authorName} <${authorEmail}>\n */`;

        edit.replace(document.uri, replaceRange, newContent);
      } else if (headerLines.length === 6) {
        const newContent = ` * Last Modified Date: ${formatDate(new Date())}\n * Last Modified By: ${authorName} <${authorEmail}>`;

        const changingLineStartPosition = document.positionAt(headerStart + headerContent.indexOf(headerLines[4]));
        const changingLineEndPosition = document.positionAt(headerStart + headerContent.indexOf(headerLines[4]) + headerLines[4].length);
        const changingLineRange = new vscode.Range(changingLineStartPosition, changingLineEndPosition);

        edit.replace(document.uri, changingLineRange, newContent);
      } else {
        const newLastModifiedDate = ` * Last Modified Date: ${formatDate(new Date())}`;
        const newLastModifiedBy = ` * Last Modified By: ${authorName} <${authorEmail}>`;

        const lastModifiedDateStartPosition = document.positionAt(headerStart + headerContent.indexOf(headerLines[4]));
        const lastModifiedDateEndPosition = document.positionAt(headerStart + headerContent.indexOf(headerLines[4]) + headerLines[4].length);
        const lastModifiedDateRange = new vscode.Range(lastModifiedDateStartPosition, lastModifiedDateEndPosition);

        const lastModifiedByStartPosition = document.positionAt(headerStart + headerContent.indexOf(headerLines[5]));
        const lastModifiedByEndPosition = document.positionAt(headerStart + headerContent.indexOf(headerLines[5]) + headerLines[5].length);
        const lastModifiedByRange = new vscode.Range(lastModifiedByStartPosition, lastModifiedByEndPosition);

        edit.replace(document.uri, lastModifiedDateRange, newLastModifiedDate);
        edit.replace(document.uri, lastModifiedByRange, newLastModifiedBy);
      }
    } else {
      // If not exists comment lines then generate comment lines
      const relativePath = vscode.workspace.asRelativePath(document.uri);
      const newHeaderContent = `/**
 * @file: ${relativePath}
 * @author: ${authorName} <${authorEmail}>
 * Date: ${formatDate(new Date())}
 * Last Modified Date: ${formatDate(new Date())}
 * Last Modified By: ${authorName} <${authorEmail}>
 */
${content}`;
      const range = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(document.lineCount, 0));
      edit.replace(document.uri, range, newHeaderContent);
    }

    vscode.workspace.applyEdit(edit);
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
