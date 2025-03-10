import {
	App,
	Editor,
	MarkdownView,
	Menu,
	Notice,
	Plugin,
	TFile,
} from "obsidian";

export default class ExtractHeadingWithEmbedPlugin extends Plugin {
	async onload() {
		// 1) Our normal “command palette” command (from the earlier example).
		this.addCommand({
			id: "extract-heading-with-embed",
			name: "Extract Heading (with embed)",
			checkCallback: (checking: boolean) => {
				const mdView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!mdView) return false;

				const editor = mdView.editor;
				const { line } = editor.getCursor();
				const lineText = editor.getLine(line);
				const isHeading = lineText.match(/^#+\s+/);
				if (!isHeading) return false;

				if (checking) return true;
				this.extractHeadingWithEmbed(mdView, line);
				return true;
			},
		});

		// 2) Register a context menu item in the editor
		this.registerEvent(
			this.app.workspace.on(
				"editor-menu",
				(menu: Menu, editor: Editor, view: MarkdownView) => {
					// The line the user right-clicked on (or the cursor line)
					const { line } = editor.getCursor();
					const lineText = editor.getLine(line);
					const isHeading = lineText.match(/^#+\s+/);
					if (isHeading) {
						// If the line is a heading, add a context menu item
						menu.addItem((item) => {
							item.setTitle("Extract Heading (with embed)")
								.setIcon("document") // Or any Obsidian icon you like
								.onClick(() => {
									this.extractHeadingWithEmbed(view, line);
								});
						});
					}
				}
			)
		);
	}

	/**
	 * Extract the heading at the given line, plus its sub-content,
	 * into a new file. Then embed it in the original note.
	 * (This is the same function shown before, unchanged.)
	 */

	/**
	 * Extract the heading at the given line, plus all sub-content,
	 * into a new file. Insert an embedded link in the original note
	 * that references the new file with the special snippet tokens.
	 */
	private async extractHeadingWithEmbed(
		mdView: MarkdownView,
		headingLine: number
	) {
		const editor = mdView.editor;
		const file = mdView.file;
		if (!file) {
			new Notice("No active file found.");
			return;
		}

		// 1) Get all lines of the current file
		const originalText = await this.app.vault.read(file);
		const lines = originalText.split(/\r?\n/);

		// 2) Identify which line is our heading line
		if (headingLine < 0 || headingLine >= lines.length) {
			new Notice("Invalid heading line selected.");
			return;
		}
		const headingText = lines[headingLine];
		const headingMatch = headingText.match(/^(#+)\s+(.*)/);
		if (!headingMatch) {
			new Notice("Not a valid heading line.");
			return;
		}

		const headingLevel = headingMatch[1].length; // e.g. ## => level 2
		const headingTitle = headingMatch[2].trim(); // e.g. "Temperature Scales"

		// 3) Duplicate the heading line (so it remains in the original doc).
		//    We'll do this by leaving the line alone but re-inserting it below if needed.

		// 4) Gather all lines that belong to this heading
		//    - from headingLine to the next heading of the same or higher level, or end of file.
		let endLine = lines.length;
		for (let i = headingLine + 1; i < lines.length; i++) {
			const match = lines[i].match(/^(#+)\s+(.*)/);
			if (match) {
				const testLevel = match[1].length;
				if (testLevel <= headingLevel) {
					endLine = i;
					break;
				}
			}
		}

		// lines[headingLine..endLine-1] belongs to this heading
		const extractedLines = lines.slice(headingLine, endLine);

		// 5) "Extract" those lines from the original doc, but keep the heading line in the doc.
		//    The difference from the normal "Extract this heading" is that we do NOT remove
		//    the heading line itself. But we DO remove sub-lines that belong to it.
		//    So effectively we remove lines from (headingLine+1)..(endLine-1).
		let updatedLines = [
			...lines.slice(0, headingLine + 1),
			...lines.slice(endLine),
		];

		// 6) Shift the extracted headings so that the main heading is level 1.
		//    That means we want headingLevel -> 1, so shift = (headingLevel - 1).
		const levelShift = headingLevel - 1;

		const shiftedExtractedLines = extractedLines.map((l) => {
			const m = l.match(/^(#+)\s+(.*)/);
			if (m) {
				const oldLevel = m[1].length;
				const text = m[2];
				const newLevel = oldLevel - levelShift; // reduce heading level by 'levelShift'
				const newHashes = "#".repeat(Math.max(1, newLevel));
				return `${newHashes} ${text}`;
			}
			return l;
		});

		// 7) Construct the new file name from the heading text.
		//    You may want to sanitize or adjust to avoid collisions.
		const newFileName = this.makeFileName(headingTitle);

		// 8) Create the new file in the same folder as the original file
		//    If you want a subfolder, adjust path accordingly.
		let folderPath = file.parent?.path;
		if (!folderPath) folderPath = "/";
		const newFilePath = folderPath + "/" + newFileName;

		// 9) Create the new file content and write it
		const newFileContent = shiftedExtractedLines.join("\n");
		let createdFile: TFile;
		try {
			createdFile = await this.app.vault.create(
				newFilePath,
				newFileContent
			);
		} catch (e) {
			// If the file already exists, consider overwriting or appending
			// For now, let's just show an error.
			new Notice(
				`Could not create file "${newFilePath}". It might already exist.`
			);
			return;
		}

		// 10) Insert an embedded link with special snippet tokens after the heading line
		//     We'll insert it immediately after the heading line we duplicated.
		const embedLine = `![[${newFileName} | no-h1 no-title no-inline-title ]]`;
		updatedLines.splice(headingLine + 1, 0, embedLine);

		// 11) Write the updated content back to the original file
		const finalText = updatedLines.join("\n");
		await this.app.vault.modify(file, finalText);

		new Notice(`Extracted heading into ${newFileName}`);
	}

	/**
	 * Create a file name from the heading text, ensuring it ends with .md
	 * and removing any illegal filename characters.
	 */
	private makeFileName(headingTitle: string): string {
		// Remove common illegal characters for filenames. Adjust as needed.
		const sanitized = headingTitle.replace(/[/\\?%*:|"<>]/g, "").trim();
		return `${sanitized}.md`;
	}
}
