import { useEffect } from "react"
import { $getRoot, $createTextNode } from "lexical"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { cn } from "@/lib/utils"

const theme = {
  paragraph: "mb-1",
  text: {
    bold: "font-semibold",
    italic: "italic",
    underline: "underline",
  },
}

function onError(error: Error) {
  console.error(error)
}

function InitialContentPlugin({ initialContent }: { initialContent: string }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (initialContent) {
      editor.update(() => {
        const root = $getRoot()
        root.clear()
        root.append($createTextNode(initialContent))
      })
    }
  }, [editor, initialContent])

  return null
}

interface NoteEditorProps {
  initialContent?: string
  onContentChange?: (content: string) => void
}

export function NoteEditor({ initialContent = "", onContentChange }: NoteEditorProps) {
  const initialConfig = {
    namespace: "NoteEditor",
    theme,
    onError,
  }

  return (
    <div className="h-full">
      <LexicalComposer initialConfig={initialConfig}>
        <div className="h-full relative">
          <PlainTextPlugin
            contentEditable={
              <ContentEditable
                className={cn(
                  "h-full w-full p-6 text-base ring-offset-background resize-none",
                  "placeholder:text-muted-foreground focus-visible:outline-none",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              />
            }
            placeholder={
              <div className="absolute top-6 left-6 text-base text-muted-foreground pointer-events-none">
                Start writing your note...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin
            onChange={(editorState) => {
              editorState.read(() => {
                const root = $getRoot()
                const textContent = root.getTextContent()
                onContentChange?.(textContent)
              })
            }}
          />
          <HistoryPlugin />
          <InitialContentPlugin initialContent={initialContent} />
        </div>
      </LexicalComposer>
    </div>
  )
}