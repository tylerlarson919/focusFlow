"use client";

import RichTextEditor from "../components/RichTextEditor";
import { useForm } from "react-hook-form";
import './customStyles.css'

interface RichTextEditorProps {
  initialContent: string;
}

export default function RichTextEditorPage({ initialContent }: RichTextEditorProps) {
  const form = useForm({
    defaultValues: {
      post: initialContent || "",
    },
  });

  return (
    <div>
      <RichTextEditor
        content={form.getValues("post")}
        onChange={(value: string) => form.setValue("post", value)} // Explicitly typing 'value' as a string
      />
    </div>
  );
}
