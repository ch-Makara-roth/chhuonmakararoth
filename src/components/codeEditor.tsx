"use client";

import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import Split from 'react-split';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Play, Loader2, Code, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Contribution } from '@/lib/data';

type SupportedLanguage = 'javascript' | 'python' | 'java' | 'c' | 'cpp' | 'go' | 'rust' | 'typescript';

const languages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
] as const;

const defaultCode: Record<SupportedLanguage, string> = {
  javascript: '// Simple JavaScript example\n' +
              'function greet(name) {\n' +
              '  return `Hello, ${name}!`;\n' +
              '}\n\n' +
              'const message = greet("World");\n' +
              'console.log(message);',
  typescript: '// TypeScript example\n' +
              'function greet(name: string): string {\n' +
              '  return `Hello, ${name}!`;\n' +
              '}\n\n' +
              'const message: string = greet("World");\n' +
              'console.log(message);',
  python: 'def greet(name):\n' +
          '    return f"Hello, {name}!"\n\n' +
          'message = greet("World")\n' +
          'print(message)',
  java: 'public class Main {\n' +
        '    public static void main(String[] args) {\n' +
        '        System.out.println(greet("World"));\n' +
        '    }\n\n' +
        '    public static String greet(String name) {\n' +
        '        return "Hello, " + name + "!";\n' +
        '    }\n' +
        '}',
  c: '#include <stdio.h>\n' +
     '#include <string.h>\n\n' +
     'void greet(char* name, char* result) {\n' +
     '    sprintf(result, "Hello, %s!", name);\n' +
     '}\n\n' +
     'int main() {\n' +
     '    char message[100];\n' +
     '    greet("World", message);\n' +
     '    printf("%s\\n", message);\n' +
     '    return 0;\n' +
     '}',
  cpp: '#include <iostream>\n' +
       '#include <string>\n\n' +
       'std::string greet(const std::string& name) {\n' +
       '    return "Hello, " + name + "!";\n' +
       '}\n\n' +
       'int main() {\n' +
       '    std::string message = greet("World");\n' +
       '    std::cout << message << std::endl;\n' +
       '    return 0;\n' +
       '}',
  go: 'package main\n\n' +
      'import "fmt"\n\n' +
      'func greet(name string) string {\n' +
      '    return fmt.Sprintf("Hello, %s!", name)\n' +
      '}\n\n' +
      'func main() {\n' +
      '    message := greet("World")\n' +
      '    fmt.Println(message)\n' +
      '}',
  rust: 'fn greet(name: &str) -> String {\n' +
        '    format!("Hello, {}!", name)\n' +
        '}\n\n' +
        'fn main() {\n' +
        '    let message = greet("World");\n' +
        '    println!("{}", message);\n' +
        '}',
};

interface CodeEditorProps {
  initialCode?: string;
  initialLanguage?: SupportedLanguage;
  height?: string;
  className?: string;
  hotspots?: Contribution['hotspots'];
  onHotspotClick?: (hotspotId: string) => void;
}

const CodeEditor = ({ 
  initialCode, 
  initialLanguage = 'javascript',
  height = '500px',
  className,
  hotspots,
  onHotspotClick
}: CodeEditorProps) => {
  const [language, setLanguage] = useState<SupportedLanguage>(initialLanguage);
  const [code, setCode] = useState(initialCode || defaultCode[initialLanguage]);
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [theme, setTheme] = useState('vs-dark');
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  useEffect(() => {
    if (!initialCode) {
      setCode(defaultCode[language]);
    }
  }, [language, initialCode]);

  // Add decorations for hotspots when the editor is ready and when hotspots change
  useEffect(() => {
    if (editorRef.current && monacoRef.current && hotspots && hotspots.length > 0) {
      const editor = editorRef.current;
      const monaco = monacoRef.current;
      
      const decorations = hotspots.map(hotspot => {
        // Find the position of the hotspot in the code
        const startIndex = code.indexOf(hotspot.area);
        if (startIndex === -1) return null;

        // Calculate the start and end positions
        const startPos = editor.getModel().getPositionAt(startIndex);
        const endPos = editor.getModel().getPositionAt(startIndex + hotspot.area.length);

        return {
          range: new monaco.Range(
            startPos.lineNumber,
            startPos.column,
            endPos.lineNumber,
            endPos.column
          ),
          options: {
            inlineClassName: 'monaco-hotspot-highlight',
            hoverMessage: { value: hotspot.details },
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          }
        };
      }).filter(Boolean);

      // Apply decorations
      if (decorations.length > 0) {
        editor.deltaDecorations([], decorations);
      }
    }
  }, [hotspots, code]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value as SupportedLanguage);
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Add custom CSS for hotspot highlighting
    monaco.editor.defineTheme('custom-theme', {
      base: theme === 'vs-dark' ? 'vs-dark' : theme === 'hc-black' ? 'hc-black' : 'vs',
      inherit: true,
      rules: [],
      colors: {}
    });
    
    monaco.editor.setTheme('custom-theme');
    
    // Add click handler for hotspots
    if (hotspots && onHotspotClick) {
      editor.onMouseDown((e: any) => {
        if (e.target.position) {
          const position = e.target.position;
          const offset = editor.getModel().getOffsetAt(position);
          const text = code.substring(0, offset);
          
          // Check if click is within a hotspot
          hotspots.forEach(hotspot => {
            const startIndex = code.indexOf(hotspot.area);
            if (startIndex !== -1) {
              const endIndex = startIndex + hotspot.area.length;
              if (offset >= startIndex && offset <= endIndex) {
                onHotspotClick(hotspot.id);
              }
            }
          });
        }
      });
    }
  };

  const executeCode = async () => {
    setIsLoading(true);
    setOutput('Executing code...');
    setError(null);
    
    // Clean up the code - remove line numbers if they appear to be prepended
    const cleanedCode = code.replace(/^\d+\s*/, '').replace(/\n\d+\s*/g, '\n');
    
    // Validate code before sending to API
    if (language === 'javascript' || language === 'typescript') {
      // Check for HTML tags that might cause issues
      if (cleanedCode.includes('<') && cleanedCode.includes('>') && (cleanedCode.includes('</') || cleanedCode.includes('/>'))) {
        // Check if it's React code
        if (cleanedCode.includes('import React') || 
            cleanedCode.includes('React.') || 
            (cleanedCode.includes('function') && cleanedCode.includes('return (')) ||
            cleanedCode.includes('useState') ||
            cleanedCode.includes('useEffect')) {
          
          // Check for specific examples we can provide custom explanations for
          if (cleanedCode.includes('ExpensiveComponent') && 
              cleanedCode.includes('React.memo') && 
              cleanedCode.includes('useMemo')) {
            
            setError("Note: React performance optimization example detected.");
            setOutput(
              "This example demonstrates React performance optimization techniques:\n\n" +
              "1. React.memo - Prevents unnecessary re-renders of components when props haven't changed\n" +
              "2. useMemo - Caches expensive computations between renders\n\n" +
              "Before optimization:\n" +
              "- The ExpensiveComponent re-renders for every change\n" +
              "- computeStyle() runs on every render for each item\n\n" +
              "After optimization:\n" +
              "- OptimizedListItem only re-renders when its props change\n" +
              "- computeStyle() only runs when the item changes"
            );
            setIsLoading(false);
            return;
          }
          
          setError("Note: React JSX code cannot be executed directly.");
          setOutput(
            "This appears to be a React component example. React components need to be rendered in a React environment.\n\n" +
            "Key points from this example:\n" +
            "- Uses React.memo to prevent unnecessary re-renders\n" +
            "- Uses React.useMemo to cache expensive computations\n" +
            "- Optimizes performance by memoizing components and values"
          );
          setIsLoading(false);
          return;
        } else {
          setError("Error: HTML code detected. Please use JavaScript/TypeScript code only.");
          setOutput('');
          setIsLoading(false);
          return;
        }
      }
    }
    
    try {
      // Map TypeScript to JavaScript for execution
      const executionLanguage = language === 'typescript' ? 'javascript' : language;
      
      const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
        language: executionLanguage,
        version: '*',
        files: [
          {
            content: cleanedCode
          }
        ]
      });
      
      if (response.data.run) {
        setOutput(response.data.run.output || 'No output');
      } else {
        setOutput('No output received');
      }
    } catch (err) {
      console.error('Error executing code:', err);
      const error = err as Error | { response?: { data?: { message?: string } } };
      setError(`Error: ${error instanceof Error ? error.message : 
        (error.response?.data?.message || 'Unknown error')}`);
      setOutput('');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if code is likely React JSX
  const isReactCode = (code: string): boolean => {
    return code.includes('import React') || 
      code.includes('React.') || 
      code.includes('<React.') ||
      (code.includes('function') && code.includes('return (')) ||
      code.includes('useState') ||
      code.includes('useEffect') ||
      (code.includes('<') && code.includes('/>'));
  };

  // Determine the best language mode for syntax highlighting
  const getEditorLanguage = (lang: SupportedLanguage, codeContent: string): string => {
    if ((lang === 'javascript' || lang === 'typescript') && isReactCode(codeContent)) {
      return 'typescript'; // TypeScript handles JSX better in Monaco
    }
    return lang;
  };

  return (
    <div className={cn("rounded-md border shadow-sm", className)} style={{ height }}>
      <div className="p-3 border-b bg-muted/30 flex flex-wrap justify-between items-center gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Code size={16} className="text-muted-foreground" />
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger className="w-[100px] h-8">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vs-dark">Dark</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="hc-black">High Contrast</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-2">
            <span className="text-xs whitespace-nowrap text-muted-foreground">Font: {fontSize}px</span>
            <Slider 
              value={[fontSize]} 
              min={10} 
              max={24} 
              step={1} 
              onValueChange={(value) => setFontSize(value[0])}
              className="w-20"
            />
          </div>
        </div>
        
        <Button
          onClick={executeCode}
          disabled={isLoading}
          variant="default"
          size="sm"
          className="gap-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Running
            </>
          ) : (
            <>
              <Play className="h-4 w-4" /> Run Code
            </>
          )}
        </Button>
      </div>
      
      <div className="flex-1 h-[calc(100%-48px)]">
        <Split
          sizes={[60, 40]}
          direction="horizontal"
          className="flex h-full"
          gutterSize={6}
          gutterStyle={() => ({
            backgroundColor: 'var(--border)',
            cursor: 'col-resize',
          })}
        >
          <div className="h-full code-editor-container">
            <Editor
              height="100%"
              language={getEditorLanguage(language, code)}
              value={code}
              onChange={handleEditorChange}
              theme={theme}
              options={{
                fontSize: fontSize,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                lineNumbers: 'on',
                folding: true,
                wordWrap: 'on',
                tabSize: 2,
                formatOnPaste: true,
                formatOnType: true,
              }}
              loading={<div className="flex items-center justify-center h-full text-muted-foreground">Loading editor...</div>}
              onMount={handleEditorDidMount}
              beforeMount={(monaco) => {
                monaco.editor.defineTheme('custom-theme', {
                  base: theme === 'vs-dark' ? 'vs-dark' : theme === 'hc-black' ? 'hc-black' : 'vs',
                  inherit: true,
                  rules: [],
                  colors: {}
                });
                
                // Add CSS for hotspot highlighting
                const styleId = 'monaco-hotspot-styles';
                if (!document.getElementById(styleId)) {
                  const style = document.createElement('style');
                  style.id = styleId;
                  style.innerHTML = `
                    .monaco-hotspot-highlight {
                      background-color: rgba(var(--primary), 0.2);
                      color: hsl(var(--primary));
                      font-weight: 600;
                      border-radius: 2px;
                      cursor: pointer;
                    }
                    .monaco-hotspot-highlight:hover {
                      background-color: rgba(var(--primary), 0.4);
                    }
                    .code-editor-container .monaco-editor .view-overlays .current-line {
                      border: none;
                    }
                  `;
                  document.head.appendChild(style);
                }
              }}
            />
          </div>
          <div className="h-full p-3 border-l overflow-auto bg-muted/10">
            <div className="flex items-center gap-1 mb-2">
              <Terminal size={16} className="text-muted-foreground" />
              <h3 className="text-sm font-medium">Output</h3>
            </div>
            <div className="bg-muted/30 p-3 rounded-md h-[calc(100%-2rem)] overflow-auto">
              {error ? (
                <pre className="whitespace-pre-wrap font-mono text-sm text-destructive">
                  {error}
                </pre>
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {output || 'Run your code to see output here'}
                </pre>
              )}
            </div>
          </div>
        </Split>
      </div>
    </div>
  );
};

export default CodeEditor; 