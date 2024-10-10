import { Node, mergeAttributes } from '@tiptap/core';

// Define the Column node
export const Column = Node.create({
  name: 'column',

  content: 'block+',

  isolating: true,

  // Define the attributes for the column
  addAttributes() {
    return {
      position: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-position'),
        renderHTML: (attributes) => ({ 'data-position': attributes.position }),
      },
    };
  },

  // Render HTML for the column node
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'column' }), 0];
  },

  // Parse HTML to create the column node
  parseHTML() {
    return [
      {
        tag: 'div[data-type="column"]',
      },
    ];
  },
});

// Export the Column node
export default Column;
