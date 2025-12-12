import { useEffect, useState } from "react";
import { Globe, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";

interface SEOSource {
  id: string;
  name: string;
  source_type: string;
  callCount: number;
}

export function SEOSourceReport() {
  const { currentWorkspace } = useWorkspace();
  const [sources, setSources] = useState<SEOSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSources() {
      if (!currentWorkspace) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      // Fetch SEO sources
      const { data: seoData, error: seoError } = await supabase
        .from("seo_sources")
        .select("*")
        .eq("workspace_id", currentWorkspace.id);

      if (seoError) {
        console.error("Error fetching SEO sources:", seoError);
        setLoading(false);
        return;
      }

      // For each source, count calls
      const sourcesWithCounts = await Promise.all(
        (seoData || []).map(async (source) => {
          const { count } = await supabase
            .from("call_logs")
            .select("*", { count: "exact", head: true })
            .eq("seo_source_id", source.id);

          return {
            id: source.id,
            name: source.name,
            source_type: source.source_type,
            callCount: count || 0,
          };
        })
      );

      setSources(sourcesWithCounts.sort((a, b) => b.callCount - a.callCount));
      setLoading(false);
    }

    fetchSources();
  }, [currentWorkspace]);

  const maxCalls = Math.max(...sources.map((s) => s.callCount), 1);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent mx-auto" />
        <p className="text-muted-foreground mt-2">Loading sources...</p>
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">SEO Source Performance</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Organic landing pages driving phone calls
          </p>
        </div>
        <div className="p-8 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-1">No sources configured</h3>
          <p className="text-sm text-muted-foreground">
            Add SEO sources to track performance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">SEO Source Performance</h3>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Organic landing pages driving phone calls
        </p>
      </div>

      <div className="divide-y divide-border">
        {sources.map((source) => (
          <div key={source.id} className="p-4 hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm truncate max-w-48">
                {source.name}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {source.source_type}
              </span>
            </div>

            <div className="flex items-center gap-4 mb-2">
              <div className="flex-1">
                <Progress value={(source.callCount / maxCalls) * 100} className="h-2" />
              </div>
              <span className="text-sm font-medium w-16 text-right">
                {source.callCount} calls
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
