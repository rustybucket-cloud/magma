import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from "@lexical/markdown";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { $getRoot, EditorState } from "lexical";
import { useEffect, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

interface NoteEditorProps {
  onContentChange?: (content: string) => void;
  initialContent?: string;
}

export function NoteEditor({
  onContentChange,
  initialContent,
}: NoteEditorProps) {
  const initialConfig = {
    namespace: "NoteEditor",
    onError: (error: Error) => {
      console.error("Lexical error:", error);
    },
    nodes: [
      HorizontalRuleNode,
      HeadingNode,
      QuoteNode,
      CodeNode,
      ListNode,
      ListItemNode,
      LinkNode,
    ],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <NoteEditorContent
        initialContent={initialContent}
        onContentChange={onContentChange}
      />
    </LexicalComposer>
  );
}

function NoteEditorContent({
  initialContent,
  onContentChange,
}: {
  initialContent?: string;
  onContentChange?: (content: string) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const loadedRef = useRef<boolean>(false);

  useEffect(() => {
    if (loadedRef.current) return;

    if (initialContent) {
      loadedRef.current = true;
      editor.update(() => {
        $convertFromMarkdownString(initialContent || "", TRANSFORMERS);
      });
    }
  }, [initialContent]);

  return (
    <>
      <AutoFocusPlugin />
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            aria-placeholder="Enter some text..."
            placeholder={<div>Enter some text...</div>}
          />
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <OnChangePlugin
        onChange={(editorState: EditorState) => {
          editorState.read(() => {
            const root = $getRoot();
            const markdown = $convertToMarkdownString(TRANSFORMERS, root);
            onContentChange?.(markdown);
          });
        }}
      />
      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
    </>
  );
}
