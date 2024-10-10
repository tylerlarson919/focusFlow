import { Node } from '@tiptap/core';

// Define the column layout enum
export enum ColumnLayout {
  SidebarLeft = 'sidebar-left',
  SidebarRight = 'sidebar-right',
  TwoColumn = 'two-column',
}

// Extend the commands interface for Tiptap
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    columns: {
      setColumns: () => ReturnType;
      setLayout: (layout: ColumnLayout) => ReturnType;
    };
  }
}

// Define the Columns node
// Define the Columns node
export const Columns = Node.create({
  name: 'columns',
  
  group: 'block', 
  
  content: 'column column',
  
  defining: true,
  
  isolating: true,
  
  // Define attributes for the columns
  addAttributes() {
    return {
      layout: {
        default: ColumnLayout.TwoColumn,
      },
    };
  },
  
  // Define commands for the columns node
  addCommands() {
    return {
      setColumns: () => ({ commands }) => 
        commands.insertContent(`
          <div data-type="columns">
            <div data-type="column" data-position="left" style="flex: 1; width: 50%;"><p></p></div>
            <div data-type="column" data-position="right" style="flex: 1; width: 50%;"><p></p></div>
          </div>
        `),
      setLayout: (layout: ColumnLayout) => ({ commands }) =>
        commands.updateAttributes('columns', { layout }),
    };
  },
  
  // Render HTML for the columns node
  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'columns', class: `layout-${HTMLAttributes.layout}` }, 0];
  },
  
  // Parse HTML to create the columns node
  parseHTML() {
    return [
      {
        tag: 'div[data-type="columns"]',
      },
    ];
  },
});


// Export the Columns node
export default Columns;
