'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Phone, Calendar, Clock, MapPin, Globe, Tag, FileText, Play } from "lucide-react";
import { format } from "date-fns";

interface CallDetail {
  id: string;
  caller_number: string;
  caller_name: string | null;
  caller_city: string | null;
  caller_state: string | null;
  caller_country: string | null;
  duration_seconds: number;
  status: string;
  source: string | null;
  campaign: string | null;
  landing_page: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  first_touch_source: string | null;
  first_touch_medium: string | null;
  first_touch_campaign: string | null;
  call_started_at: string;
  call_ended_at: string | null;
  attribution_path: any;
  tracking_numbers?: {
    phone_number: string;
    label: string | null;
  };
  call_recordings?: {
    id: string;
    storage_path: string | null;
    transcription: string | null;
    transcription_status: string | null;
    sentiment_score: number | null;
    summary: string | null;
    keywords: any;
  }[];
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m ${secs}s`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

export default function CallDetailPage() {
  const params = useParams();
  const router = useRouter();
  const callId = params.id as string;
  const [call, setCall] = useState<CallDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCall() {
      if (!callId) return;

      setLoading(true);
      const { data, error } = await supabase
        .from("call_logs")
        .select(`
          *,
          tracking_numbers (
            phone_number,
            label
          ),
          call_recordings (
            id,
            storage_path,
            transcription,
            transcription_status,
            sentiment_score,
            summary,
            keywords
          )
        `)
        .eq("id", callId)
        .single();

      if (error) {
        console.error("Error fetching call:", error);
      } else {
        setCall(data as any);
      }
      setLoading(false);
    }

    fetchCall();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`call_detail:${callId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "call_logs",
          filter: `id=eq.${callId}`,
        },
        async () => {
          // Refetch call data
          const { data } = await supabase
            .from("call_logs")
            .select(`
              *,
              tracking_numbers (
                phone_number,
                label
              ),
              call_recordings (
                id,
                storage_path,
                transcription,
                transcription_status,
                sentiment_score,
                summary,
                keywords
              )
            `)
            .eq("id", callId)
            .single();

          if (data) {
            setCall(data as any);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [callId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="rounded-lg border border-border p-8 text-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent mx-auto" />
            <p className="text-muted-foreground mt-2">Loading call details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!call) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="rounded-lg border border-border p-8 text-center">
            <h3 className="font-semibold mb-1">Call not found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The call you're looking for doesn't exist.
            </p>
            <Button onClick={() => router.push("/dashboard/calls")}>
              Back to Calls
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const recording = call.call_recordings?.[0];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/calls")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Calls
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {call.caller_name || call.caller_number}
              </h1>
              <p className="text-muted-foreground">
                Call from {format(new Date(call.call_started_at), "PPpp")}
              </p>
            </div>
            <Badge variant={call.status === "completed" ? "default" : "secondary"}>
              {call.status}
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attribution">Attribution</TabsTrigger>
            {recording && <TabsTrigger value="recording">Recording</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Call Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Call Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Caller Number</p>
                      <p className="font-medium">{call.caller_number}</p>
                    </div>
                  </div>
                  {call.caller_name && (
                    <div className="flex items-center gap-3">
                      <Tag className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Caller Name</p>
                        <p className="font-medium">{call.caller_name}</p>
                      </div>
                    </div>
                  )}
                  {(call.caller_city || call.caller_state) && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">
                          {[call.caller_city, call.caller_state, call.caller_country]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">
                        {formatDuration(call.duration_seconds)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Started</p>
                      <p className="font-medium">
                        {format(new Date(call.call_started_at), "PPpp")}
                      </p>
                    </div>
                  </div>
                  {call.call_ended_at && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Ended</p>
                        <p className="font-medium">
                          {format(new Date(call.call_ended_at), "PPpp")}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tracking Number */}
              <Card>
                <CardHeader>
                  <CardTitle>Tracking Number</CardTitle>
                </CardHeader>
                <CardContent>
                  {call.tracking_numbers ? (
                    <div>
                      <p className="text-2xl font-bold mb-2">
                        {call.tracking_numbers.phone_number}
                      </p>
                      {call.tracking_numbers.label && (
                        <p className="text-sm text-muted-foreground">
                          {call.tracking_numbers.label}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No tracking number</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="attribution" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* UTM Parameters */}
              <Card>
                <CardHeader>
                  <CardTitle>UTM Parameters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {call.utm_source && (
                    <div>
                      <p className="text-sm text-muted-foreground">Source</p>
                      <p className="font-medium">{call.utm_source}</p>
                    </div>
                  )}
                  {call.utm_medium && (
                    <div>
                      <p className="text-sm text-muted-foreground">Medium</p>
                      <p className="font-medium">{call.utm_medium}</p>
                    </div>
                  )}
                  {call.utm_campaign && (
                    <div>
                      <p className="text-sm text-muted-foreground">Campaign</p>
                      <p className="font-medium">{call.utm_campaign}</p>
                    </div>
                  )}
                  {call.utm_term && (
                    <div>
                      <p className="text-sm text-muted-foreground">Term</p>
                      <p className="font-medium">{call.utm_term}</p>
                    </div>
                  )}
                  {call.utm_content && (
                    <div>
                      <p className="text-sm text-muted-foreground">Content</p>
                      <p className="font-medium">{call.utm_content}</p>
                    </div>
                  )}
                  {!call.utm_source && !call.utm_medium && (
                    <p className="text-muted-foreground">No UTM parameters</p>
                  )}
                </CardContent>
              </Card>

              {/* First Touch Attribution */}
              <Card>
                <CardHeader>
                  <CardTitle>First Touch Attribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {call.first_touch_source && (
                    <div>
                      <p className="text-sm text-muted-foreground">Source</p>
                      <p className="font-medium">{call.first_touch_source}</p>
                    </div>
                  )}
                  {call.first_touch_medium && (
                    <div>
                      <p className="text-sm text-muted-foreground">Medium</p>
                      <p className="font-medium">{call.first_touch_medium}</p>
                    </div>
                  )}
                  {call.first_touch_campaign && (
                    <div>
                      <p className="text-sm text-muted-foreground">Campaign</p>
                      <p className="font-medium">{call.first_touch_campaign}</p>
                    </div>
                  )}
                  {!call.first_touch_source && (
                    <p className="text-muted-foreground">No first touch data</p>
                  )}
                </CardContent>
              </Card>

              {/* Landing Page & Referrer */}
              <Card>
                <CardHeader>
                  <CardTitle>Traffic Source</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {call.landing_page && (
                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Landing Page</p>
                        <p className="font-medium break-all">{call.landing_page}</p>
                      </div>
                    </div>
                  )}
                  {call.referrer && (
                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Referrer</p>
                        <p className="font-medium break-all">{call.referrer}</p>
                      </div>
                    </div>
                  )}
                  {call.source && (
                    <div>
                      <p className="text-sm text-muted-foreground">Source</p>
                      <p className="font-medium">{call.source}</p>
                    </div>
                  )}
                  {call.campaign && (
                    <div>
                      <p className="text-sm text-muted-foreground">Campaign</p>
                      <p className="font-medium">{call.campaign}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {recording && (
            <TabsContent value="recording" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Call Recording</CardTitle>
                  <CardDescription>
                    {recording.transcription_status === "completed"
                      ? "Transcription available"
                      : recording.transcription_status === "processing"
                      ? "Processing transcription..."
                      : "Transcription pending"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {recording.storage_path && (
                    <div>
                      <p className="text-sm font-medium mb-2">Audio Recording</p>
                      <audio controls className="w-full">
                        <source src={recording.storage_path} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}

                  {recording.transcription && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Transcription</p>
                        {recording.sentiment_score !== null && (
                          <Badge
                            variant={
                              recording.sentiment_score > 0.2
                                ? "default"
                                : recording.sentiment_score < -0.2
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            Sentiment:{" "}
                            {recording.sentiment_score > 0.2
                              ? "Positive"
                              : recording.sentiment_score < -0.2
                              ? "Negative"
                              : "Neutral"}
                          </Badge>
                        )}
                      </div>
                      <div className="bg-muted p-4 rounded-md">
                        <p className="text-sm whitespace-pre-wrap">
                          {recording.transcription}
                        </p>
                      </div>
                    </div>
                  )}

                  {recording.summary && (
                    <div>
                      <p className="text-sm font-medium mb-2">Summary</p>
                      <p className="text-sm text-muted-foreground">
                        {recording.summary}
                      </p>
                    </div>
                  )}

                  {recording.keywords && Array.isArray(recording.keywords) && recording.keywords.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Keywords</p>
                      <div className="flex flex-wrap gap-2">
                        {recording.keywords.map((keyword: string, idx: number) => (
                          <Badge key={idx} variant="outline">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

