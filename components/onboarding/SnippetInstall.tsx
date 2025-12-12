'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useToast } from "@/hooks/use-toast";

interface SnippetInstallProps {
  onComplete: () => void;
  onNext: () => void;
}

export function SnippetInstall({ onComplete, onNext }: SnippetInstallProps) {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [installed, setInstalled] = useState(false);

  const snippet = `<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${typeof window !== 'undefined' ? window.location.origin : ''}/tracking.js';
    script.setAttribute('data-workspace-id', '${currentWorkspace?.id || 'YOUR_WORKSPACE_ID'}');
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Tracking snippet copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkInstalled = () => {
    setInstalled(true);
    onComplete();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Step 1: Copy the tracking snippet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Copy the code below and paste it into the &lt;head&gt; section of your website
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Tracking Snippet</CardTitle>
                <CardDescription className="text-xs">
                  Paste this code before the closing &lt;/head&gt; tag
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
              <code>{snippet}</code>
            </pre>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <h3 className="font-semibold">Step 2: Verify installation</h3>
          <p className="text-sm text-muted-foreground">
            After installing the snippet, visit your website and check the browser console.
            You should see a message confirming that CallTrack is tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="installed"
            checked={installed}
            onChange={(e) => {
              if (e.target.checked) {
                handleMarkInstalled();
              }
            }}
            className="h-4 w-4"
          />
          <Label htmlFor="installed" className="cursor-pointer">
            I've installed the tracking snippet on my website
          </Label>
        </div>
      </div>

      {installed && (
        <div className="p-4 bg-green-50 dark:bg-green-950 rounded-md border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-800 dark:text-green-200">
            ✓ Great! Your tracking snippet is installed. You can now track visitor attribution.
          </p>
        </div>
      )}
    </div>
  );
}

