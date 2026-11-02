/**
 * Tables on the website (decision 0184): Tiptap with prosemirror-tables
 * right on the element of the field, loaded as a chunk of its own on the
 * first focus of such a field. The value is the short JSON of the core,
 *
 *     {rows: [["Tag", "Zeit"], ["Montag", "8–18 Uhr"]], headerRow: true, headerColumn: false}
 *
 * a cell text or a list of inline nodes (bold, italic, link, hardBreak).
 * Tables pasted from Excel, Numbers or Google Sheets come in as cells,
 * text with tabs as well.
 */
import { Editor, Node, mergeAttributes } from '@tiptap/core';
import { Fragment, Slice } from '@tiptap/pm/model';
import { TextSelection } from '@tiptap/pm/state';
import {
    CellSelection, TableMap, addColumnAfter, addColumnBefore, addRowAfter, addRowBefore, deleteColumn, deleteRow,
    goToNextCell, handlePaste, tableEditing, toggleHeader,
} from '@tiptap/pm/tables';
import StarterKit from '@tiptap/starter-kit';
import { clean } from './richtext.js';

const MAX_COLUMNS = 20;
const MAX_ROWS = 500;
const START = [['', ''], ['', ''], ['', '']];

const cellAttributes = {
    // prosemirror-tables needs them; the value never has merged cells.
    colspan: { default: 1 },
    rowspan: { default: 1 },
    colwidth: { default: null },
};

// prosemirror-tables finds its nodes by "tableRole" in the schema;
// Tiptap takes such a field into the schema only through extendNodeSchema.
const ROLES = { table: 'table', tableRow: 'row', tableCell: 'cell', tableHeader: 'header_cell' };

const pm = (command) => () => ({ state, dispatch }) => command(state, dispatch);

const Table = Node.create({
    name: 'table',
    group: 'block',
    content: 'tableRow+',
    isolating: true,

    extendNodeSchema: (extension) => (ROLES[extension.name] ? { tableRole: ROLES[extension.name] } : {}),

    parseHTML: () => [{ tag: 'table' }],
    renderHTML: ({ HTMLAttributes }) => ['table', mergeAttributes(HTMLAttributes), ['tbody', 0]],

    addCommands() {
        return {
            addRowBefore: pm(addRowBefore),
            addRowAfter: pm(addRowAfter),
            addColumnBefore: pm(addColumnBefore),
            addColumnAfter: pm(addColumnAfter),
            deleteRow: pm(deleteRow),
            deleteColumn: pm(deleteColumn),
            // Always the first row or column, not the one of the cursor.
            toggleHeaderRow: pm(toggleHeader('row')),
            toggleHeaderColumn: pm(toggleHeader('column')),
        };
    },

    addKeyboardShortcuts() {
        return {
            // Tab goes to the next cell, in the last one it adds a row.
            Tab: () => {
                if (this.editor.commands.command(({ state, dispatch }) => goToNextCell(1)(state, dispatch))) {
                    return true;
                }

                return this.editor.chain().addRowAfter().command(({ state, dispatch }) => goToNextCell(1)(state, dispatch)).run();
            },
            'Shift-Tab': () => this.editor.commands.command(({ state, dispatch }) => goToNextCell(-1)(state, dispatch)),
        };
    },

    addProseMirrorPlugins() {
        return [tableEditing({ allowTableNodeSelection: false })];
    },
});

const TableRow = Node.create({
    name: 'tableRow',
    content: '(tableCell | tableHeader)*',
    parseHTML: () => [{ tag: 'tr' }],
    renderHTML: ({ HTMLAttributes }) => ['tr', mergeAttributes(HTMLAttributes), 0],
});

const cellNode = (name, tag) => Node.create({
    name,
    content: 'paragraph+',
    isolating: true,
    addAttributes: () => cellAttributes,
    parseHTML: () => [{ tag }],
    renderHTML: () => [tag, 0],
});

const TableCell = cellNode('tableCell', 'td');
const TableHeader = cellNode('tableHeader', 'th');

/** The document is one table. */
const TableDocument = Node.create({ name: 'doc', topNode: true, content: 'table' });

/** The document of the editor from a stored value; three rows of two cells for none. */
export function contentOf(value) {
    const rows = Array.isArray(value?.rows) && value.rows.some((row) => Array.isArray(row) && row.length > 0) ? value.rows : START;
    const width = Math.min(MAX_COLUMNS, Math.max(...rows.map((row) => (Array.isArray(row) ? row.length : 0))));
    const headerRow = value ? value.headerRow !== false : true;
    const headerColumn = value?.headerColumn === true;

    return {
        type: 'doc',
        content: [{
            type: 'table',
            content: rows.slice(0, MAX_ROWS).map((row, index) => ({
                type: 'tableRow',
                content: Array.from({ length: width }, (_, column) => ({
                    type: (headerRow && index === 0) || (headerColumn && column === 0) ? 'tableHeader' : 'tableCell',
                    content: [{ type: 'paragraph', content: inline(Array.isArray(row) ? row[column] : '') }],
                })),
            })),
        }],
    };
}

/** The inline nodes of a cell. */
function inline(cell) {
    if (Array.isArray(cell)) {
        return cell;
    }

    if (typeof cell !== 'string' || cell === '') {
        return [];
    }

    return cell.split('\n').flatMap((line, index) => [
        ...(index > 0 ? [{ type: 'hardBreak' }] : []),
        ...(line === '' ? [] : [{ type: 'text', text: line }]),
    ]);
}

/** A cell as the core stores it: text if nothing in it is formatted. */
function cellValue(cell) {
    const nodes = [];

    cell.content.forEach((paragraph, _, index) => {
        if (index > 0) {
            nodes.push({ type: 'hardBreak' });
        }

        paragraph.content.forEach((node) => nodes.push(clean(node.toJSON())));
    });

    if (nodes.every((node) => (node.type === 'text' && !node.marks) || node.type === 'hardBreak')) {
        return nodes.map((node) => (node.type === 'text' ? node.text : '\n')).join('');
    }

    return nodes;
}

/** The value to store, null when no cell holds anything. */
export function valueOf(editor) {
    const table = editor.state.doc.firstChild;

    if (!table || table.type.name !== 'table') {
        return null;
    }

    // The map covers merged cells as well, e.g. pasted ones: each counts once.
    const map = TableMap.get(table);
    const seen = new Set();
    const rows = [];

    for (let row = 0; row < map.height; row++) {
        const cells = [];

        for (let column = 0; column < map.width; column++) {
            const position = map.map[row * map.width + column];
            cells.push(seen.has(position) ? '' : cellValue(table.nodeAt(position)));
            seen.add(position);
        }

        rows.push(cells);
    }

    const filled = rows.some((row) => row.some((cell) => (typeof cell === 'string' ? cell.trim() !== '' : cell.length > 0)));

    if (!filled) {
        return null;
    }

    return { rows, ...headersOf(table) };
}

/** Whether the first row and the first column are heads. */
function headersOf(table) {
    const map = TableMap.get(table);
    const head = (row, column) => table.nodeAt(map.map[row * map.width + column])?.type.name === 'tableHeader';
    const headerRow = map.height > 0 && Array.from({ length: map.width }, (_, column) => head(0, column)).every(Boolean);
    const body = Array.from({ length: map.height }, (_, row) => row).filter((row) => !(headerRow && row === 0));

    return { headerRow, headerColumn: body.length > 0 && body.every((row) => head(row, 0)) };
}

/** Makes the cells of the table in the transaction heads as given, the others normal cells. */
function keepHeaders(tr, { headerRow, headerColumn }) {
    const table = tr.doc.firstChild;
    const map = TableMap.get(table);
    const { tableCell, tableHeader } = tr.doc.type.schema.nodes;
    const seen = new Set();

    for (let row = 0; row < map.height; row++) {
        for (let column = 0; column < map.width; column++) {
            const position = map.map[row * map.width + column];
            const cell = table.nodeAt(position);
            const type = (headerRow && row === 0) || (headerColumn && column === 0) ? tableHeader : tableCell;

            if (!seen.has(position) && cell.type !== type) {
                // The table starts right after the start of the document.
                tr.setNodeMarkup(position + 1, type, cell.attrs);
            }

            seen.add(position);
        }
    }

    return tr;
}

/**
 * Cells from a spreadsheet take the place of the ones from the cursor on;
 * the first row and column stay heads or cells as before.
 */
function paste(view, event, slice) {
    const headers = headersOf(view.state.doc.firstChild);

    return handlePaste({ state: view.state, dispatch: (tr) => view.dispatch(keepHeaders(tr, headers)) }, event, slice);
}

/** Text with tabs, e.g. copied from a spreadsheet without HTML, as a table of cells. */
function tableFromText(text, schema) {
    const lines = text.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n');

    if (!lines.some((line) => line.includes('\t'))) {
        return null;
    }

    const rows = lines.map((line) => line.split('\t'));
    const width = Math.max(...rows.map((row) => row.length));
    const { table, tableRow, tableCell, paragraph } = schema.nodes;

    return table.create(null, rows.map((row) => tableRow.create(null, Array.from({ length: width }, (_, index) => {
        const value = row[index] ?? '';

        return tableCell.create(null, paragraph.create(null, value === '' ? null : schema.text(value)));
    }))));
}

/**
 * Mounts the editor on the element; its HTML is replaced by the one
 * Tiptap renders from the stored value.
 */
export function createEditor(element, value, { update, selection, blur }) {
    return new Editor({
        element: { mount: element },
        content: contentOf(value),
        injectCSS: false,
        extensions: [
            TableDocument,
            // Only text, bold, italic, links and line breaks in a cell.
            StarterKit.configure({
                document: false,
                heading: false,
                blockquote: false,
                bulletList: false,
                orderedList: false,
                listItem: false,
                listKeymap: false,
                codeBlock: false,
                code: false,
                horizontalRule: false,
                strike: false,
                underline: false,
                dropcursor: false,
                gapcursor: false,
                trailingNode: false,
                link: {
                    openOnClick: false,
                    autolink: true,
                    defaultProtocol: 'https',
                    isAllowedUri: (url, { defaultValidate }) => url.startsWith('page:') || defaultValidate(url),
                    HTMLAttributes: { rel: null, target: null, class: null },
                },
            }),
            Table,
            TableRow,
            TableHeader,
            TableCell,
        ],
        editorProps: {
            handlePaste: paste,
            // A click puts the cursor into the cell, also when cells were
            // selected, e.g. the ones pasted last; else a paste would fill them.
            handleClick: (view, position, event) => {
                if (view.state.selection instanceof CellSelection && !event.shiftKey) {
                    view.dispatch(view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(position))));
                }

                return false;
            },
            clipboardTextParser: (text, _context, _plain, view) => {
                const table = tableFromText(text, view.state.schema);

                return table ? new Slice(Fragment.from(table), 0, 0) : null;
            },
        },
        onUpdate: () => update(),
        onTransaction: () => selection(),
        onFocus: () => selection(),
        onBlur: ({ event }) => blur(event),
    });
}
