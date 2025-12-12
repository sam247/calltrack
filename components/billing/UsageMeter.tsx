'use client'

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Phone } from 'lucide-react';

interface UsageMeterProps {
  callsUsed: number;
  callsIncluded: number;
  isUnlimited?: boolean;
}

export function UsageMeter({ callsUsed, callsIncluded, isUnlimited = false }: UsageMeterProps) {
  const usagePercent = isUnlimited ? 0 : (callsUsed / callsIncluded) * 100;
  const remaining = isUnlimited ? -1 : callsIncluded - callsUsed;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-background">
            <Phone className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Call Usage</p>
            <p className="text-xs text-muted-foreground">
              {isUnlimited
                ? 'Unlimited calls'
                : remaining >= 0
                ? `${remaining.toLocaleString()} calls remaining`
                : `${Math.abs(remaining).toLocaleString()} over limit`}
            </p>
          </div>
        </div>

        {!isUnlimited && (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">{callsUsed.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">
                / {callsIncluded.toLocaleString()}
              </span>
            </div>
            <Progress value={Math.min(usagePercent, 100)} className="h-2" />
          </>
        )}

        {isUnlimited && (
          <div className="text-2xl font-bold">{callsUsed.toLocaleString()} calls</div>
        )}
      </CardContent>
    </Card>
  );
}

