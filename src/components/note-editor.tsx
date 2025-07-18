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
  path?: string;
}

export function NoteEditor({
  onContentChange,
  initialContent,
  path,
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
        path={path}
      />
    </LexicalComposer>
  );
}

function NoteEditorContent({
  initialContent,
  onContentChange,
  path,
}: {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  path?: string;
}) {
  const [editor] = useLexicalComposerContext();
  const prevPath = useRef<string | undefined>(path);

  useEffect(() => {
    console.log({ path, prevPath: prevPath.current, initialContent });
    if (prevPath.current === path) return; // don't reinitialize if path is the same

    if (initialContent) {
      prevPath.current = path;
      editor.update(() => {
        $convertFromMarkdownString(initialContent || "", TRANSFORMERS);
      });
    }
  }, [initialContent, path]);

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
