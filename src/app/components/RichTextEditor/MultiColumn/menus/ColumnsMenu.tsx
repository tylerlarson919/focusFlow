import { BubbleMenu as BaseBubbleMenu, useEditorState } from '@tiptap/react';
import { useCallback } from 'react';
import { sticky } from 'tippy.js';
import { v4 as uuid } from 'uuid';

import { MenuProps } from '../../../menus/types';
import { getRenderContainer } from '../../../../lib/getRenderContainer';
import { ColumnLayout } from '../Columns';
import { Icon } from '../../../ui/Icon';
import './ColumnsMenu.css';
// Define the types for CustomToolbar props
interface CustomToolbarProps {
  children: React.ReactNode;
}

// Define the types for ToolbarButton props
interface ToolbarButtonProps {
  tooltip: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

// Define a simple toolbar component
const CustomToolbar: React.FC<CustomToolbarProps> = ({ children }) => {
  return (
    <div className="flex space-x-2 p-2 bg-gray-100 border rounded shadow-md z-50">
      {children}
    </div>
  );
};

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ tooltip, active, onClick, children }) => {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded transition-colors ${active ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
      title={tooltip}
    >
      {children}
    </button>
  );
};

export const ColumnsMenu = ({ editor, appendTo }: MenuProps) => {
  const getReferenceClientRect = useCallback(() => {
    const renderContainer = getRenderContainer(editor, 'columns');
    const rect = renderContainer?.getBoundingClientRect() || new DOMRect(-1000, -1000, 0, 0);
    return rect;
  }, [editor]);

  const shouldShow = useCallback(() => {
    // Check if the editor is focused and if the current selection is within a columns node
    return editor.isActive('columns') || editor.isActive('column');
  }, [editor]);
  

  const onColumnLeft = useCallback(() => {
    editor.chain().focus().setLayout(ColumnLayout.SidebarLeft).run();
  }, [editor]);

  const onColumnRight = useCallback(() => {
    editor.chain().focus().setLayout(ColumnLayout.SidebarRight).run();
  }, [editor]);

  const onColumnTwo = useCallback(() => {
    editor.chain().focus().setLayout(ColumnLayout.TwoColumn).run();
  }, [editor]);

  const { isColumnLeft, isColumnRight, isColumnTwo } = useEditorState({
    editor,
    selector: ctx => ({
      isColumnLeft: ctx.editor.isActive('columns', { layout: ColumnLayout.SidebarLeft }),
      isColumnRight: ctx.editor.isActive('columns', { layout: ColumnLayout.SidebarRight }),
      isColumnTwo: ctx.editor.isActive('columns', { layout: ColumnLayout.TwoColumn }),
    }),
  });

  return (
    <BaseBubbleMenu
      editor={editor}
      pluginKey={`columnsMenu-${uuid()}`}
      shouldShow={shouldShow}
      updateDelay={0}
      tippyOptions={{
        offset: [0, 8],
        popperOptions: {
          modifiers: [{ name: 'flip', enabled: false }],
        },
        getReferenceClientRect,
        appendTo: () => appendTo?.current,
        plugins: [sticky],
        sticky: 'popper',
      }}
    >
      <CustomToolbar>
        <ToolbarButton tooltip="Sidebar left" active={isColumnLeft} onClick={onColumnLeft}>
          <Icon name="PanelLeft" />
        </ToolbarButton>
        <ToolbarButton tooltip="Two columns" active={isColumnTwo} onClick={onColumnTwo}>
          <Icon name="Columns2" />
        </ToolbarButton>
        <ToolbarButton tooltip="Sidebar right" active={isColumnRight} onClick={onColumnRight}>
          <Icon name="PanelRight" />
        </ToolbarButton>
      </CustomToolbar>
    </BaseBubbleMenu>
  );
};

export default ColumnsMenu;
