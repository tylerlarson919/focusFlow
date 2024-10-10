"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import ToolBar from "./ToolBar";
import Heading from "@tiptap/extension-heading";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ImageResize from "tiptap-extension-resize-image";
import SlashCommand from "./SlashCommand/SlashCommand"; // Import the search extension
import Columns from "./MultiColumn/Columns";
import Column from "./MultiColumn/Column";


export default function RichTextEditor({ content, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure(),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: "list-decimal ml-3",
        },
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: "list-disc ml-3",
        },
      }),
      Highlight,
      Image,
      ImageResize,
      SlashCommand, 
      Column,
      Columns,
    ],
    content: content,
    editorProps: {
      attributes: {
        class: "min-h-[156px] border rounded-md py-2 px-3",
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
              const url = loadEvent.target.result;
              editor.chain().focus().setImage({ src: url }).run();
            };
            reader.readAsDataURL(file);
            event.preventDefault(); // Prevent default paste handling
            break; // Stop looping through items after the first image
          }
        }
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div>
      <ToolBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
