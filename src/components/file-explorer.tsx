import { CopyCheckIcon, CopyIcon } from "lucide-react"; 'CopyCheckIcon' 
import { useState, useMemo, useCallback, Fragment } from "react"; 'useState' 
import { Hint } from "@/components/hint"; 'Hint' 
import { Button } from "@/components/ui/button"; 'Button' 
import { CodeView } from "@/components/code-view"; 'CodeView'
import {
ResizableHandle, 
ResizablePanel, 
ResizablePanelGroup,
} from "@/components/ui/resizable";

import { 
Breadcrumb,
BreadcrumbItem, 
BreadcrumbList, 
BreadcrumbPage, 
BreadcrumbSeparator,
BreadcrumbEllipsis, 
} from "@/components/ui/breadcrumb" ;
import { sleep } from "@trpc/server/unstable-core-do-not-import";
import { convertFilesToTreeItems } from "@/lib/utils";
import { TreeView } from "./tree-view";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { DownloadIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";

type fileCollection= { [path: string]: string };

function getLanguageFromExtension (filename: string): string {
    const extension = filename.split(".").pop()?.toLowerCase();
    return extension || "text";
}

interface FileBreadcrumbProps {
    filePath: string;
}


const FileBreadcrumb = ({ filePath }: FileBreadcrumbProps) => {
    const pathSegments = filePath.split("/");
    const maxSegments = 4;

    const renderBreadcrumbItems = () => {
        if (pathSegments.length <= maxSegments) {
            return pathSegments.map((segment, index) => {
                const isLast = index === pathSegments.length - 1;

                return (
                    <Fragment key={index}>
                        <BreadcrumbItem>
                        {isLast ? (
                            <BreadcrumbPage className="font-medium">
                            {segment}
                            </BreadcrumbPage>
                        ) : (
                            <span className="text-muted-foreground">{segment}</span>

            )}
                        </BreadcrumbItem>
                        {!isLast && <BreadcrumbSeparator />}
                    </Fragment>
                )
            })
        } else {
            const firstSegment = pathSegments[0]     
            const lastSegment = pathSegments[pathSegments.length - 1];
            return (
                <>
                <BreadcrumbItem>
                <span className="text-muted-foreground">
                    {firstSegment}
                </span>

                                <BreadcrumbItem>

                                <BreadcrumbEllipsis />
                </BreadcrumbItem>
                          <BreadcrumbItem>

                                <BreadcrumbSeparator />
                                <BreadcrumbItem>

                                <BreadcrumbPage className="font-medium">
                                {lastSegment}
                                </BreadcrumbPage>
                                </BreadcrumbItem>
                </BreadcrumbItem>

                </BreadcrumbItem>
                
                </>
            )
        }
    }

    return (
        <Breadcrumb>
        <BreadcrumbList>
        {renderBreadcrumbItems()}
        </BreadcrumbList>
        </Breadcrumb>
    );
}





interface FileExplorerProps {
    files: fileCollection;
    sandboxId: string;
    activeFragment?: { id: string } | null;
}

export const FileExplorer = ({
    files,
    sandboxId,
    activeFragment,
}: FileExplorerProps) => {
    const [copied, setCopied] = useState(false);

    const [selectedFile, setSelectedFile] = useState<string | null>(() => {
        const fileKeys = Object.keys(files);
        return fileKeys.length > 0 ? fileKeys[0] : null;

    });

    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState("");
    const [fileState, setFileState] = useState(files);
    const editRef = useRef<HTMLTextAreaElement>(null);

    const treeData = useMemo(() => {
        return convertFilesToTreeItems(files);
    }, [files]);


    const handleFileSelect = useCallback((
        filePath: string
    ) => {
        if (files[filePath]) {
            setSelectedFile(filePath);
        }

    }, [files])


    const handleCopy = useCallback(() => {
if (selectedFile) {
navigator.clipboard.writeText(files[selectedFile]);
setCopied(true); 
setTimeout(() => {
setCopied(false);
}, 2000);
}
}, [selectedFile, files]);

    const handleEdit = useCallback(() => {
        if (selectedFile) {
            setEditContent(fileState[selectedFile]);
            setIsEditing(true);
            setTimeout(() => editRef.current?.focus(), 0);
        }
    }, [selectedFile, fileState]);

    const handleSave = useCallback(async () => {
        if (!selectedFile) return;
        try {
            // Update file in E2B sandbox
            const res = await fetch("/api/update-sandbox-file", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path: selectedFile, content: editContent, sandboxId }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to update file");
            }

            // Update local state
            const updatedFiles = { ...fileState, [selectedFile]: editContent };
            setFileState(updatedFiles);

            // Save updated files to database
            await fetch("/api/update-fragment-files", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    fragmentId: activeFragment?.id,
                    files: updatedFiles 
                }),
            });

            setIsEditing(false);
            toast.success("File updated in sandbox");
        } catch (err: any) {
            toast.error(`Failed to update file: ${err.message}`);
        }
    }, [selectedFile, editContent, sandboxId, fileState, activeFragment?.id]);

    const { has } = useAuth();
    const hasProAccess = has?.({ plan: "pro" });

    return (
        <ResizablePanelGroup direction="horizontal">
<ResizablePanel defaultSize={30} minSize={30} className="bg-sidebar"> 
    <TreeView
    data={treeData}
    value={selectedFile}
    onSelect={handleFileSelect}
    />
</ResizablePanel> 
<ResizableHandle className="hover:bg-primary transition-colors" />
<ResizablePanel defaultSize={70} minSize={50}> 
    {selectedFile && fileState[selectedFile] ? (
        <div className="h-full w-full flex flex-col">
            <div className="border-b bg-sidebar px-4 py-2 flex justify-between items-center gap-x-2">
                <FileBreadcrumb filePath={selectedFile} />
                
                <Hint text="Edit file" side="bottom">
                    <Button
                        variant="outline"
                        size="icon"
                        className="ml-2"
                        onClick={() => {
                          if (!hasProAccess) {
                            window.location.href = "/pricing";
                            return;
                          }
                          handleEdit();
                        }}
                        disabled={isEditing}
                    >
                        Edit
                    </Button>
                </Hint>
                <Hint text="Copy to clipboard" side="bottom">
                 <Button
                 variant="outline"
                 size="icon"
                 className="ml-auto"
                 onClick={handleCopy}
                 disabled={copied}
                 >
                    {copied ? <CopyCheckIcon /> : <CopyIcon />}
                    </Button>   
                </Hint>
                <Hint text="Download all as zip" side="bottom">
                  <Button
                    variant="outline"
                    size="icon"
                    className="ml-2"
                    onClick={async () => {
                      if (!hasProAccess) {
                        window.location.href = "/pricing";
                        return;
                      }
                      const zip = new JSZip();
                      Object.entries(fileState).forEach(([path, content]) => {
                        zip.file(path, content);
                      });
                      const blob = await zip.generateAsync({ type: "blob" });
                      saveAs(blob, "files.zip");
                    }}
                  >
                    <DownloadIcon />
                  </Button>
                </Hint>
            </div>
            <div className="flex-1 overflow-auto"> 
                {isEditing ? (
                    <div className="h-full flex flex-col">
                        <Textarea
                            ref={editRef}
                            className="flex-1 font-mono"
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            style={{ minHeight: 300 }}
                        />
                        <div className="flex gap-2 mt-2">
                            <Button onClick={handleSave} variant="default">Save</Button>
                            <Button onClick={() => setIsEditing(false)} variant="secondary">Cancel</Button>
                        </div>
                    </div>
                ) : (
                    <CodeView
                        code={fileState[selectedFile]}
                        lang={getLanguageFromExtension(selectedFile)}
                    />
                )}
            </div>
        </div>
    ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground">
            Select a file
        </div>
    )}
</ResizablePanel>
</ResizablePanelGroup> 


    )
};