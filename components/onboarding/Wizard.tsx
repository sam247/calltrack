'use client'

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ArrowRight, ArrowLeft } from "lucide-react";
import { SnippetInstall } from "./SnippetInstall";
import { FirstNumber } from "./FirstNumber";
import { WorkspaceSetup } from "./WorkspaceSetup";

interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
}

const steps: WizardStep[] = [
  {
    id: 'workspace',
    title: 'Workspace Setup',
    description: 'Create your workspace and configure basic settings',
    component: WorkspaceSetup,
  },
  {
    id: 'snippet',
    title: 'Install Tracking Snippet',
    description: 'Add the tracking code to your website',
    component: SnippetInstall,
  },
  {
    id: 'number',
    title: 'Add Tracking Number',
    description: 'Set up your first tracking number',
    component: FirstNumber,
  },
];

export function Wizard({ onComplete }: { onComplete?: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const handleStepComplete = (stepIndex: number) => {
    setCompletedSteps(prev => new Set([...prev, stepIndex]));
    if (stepIndex < steps.length - 1) {
      setCurrentStep(stepIndex + 1);
    } else {
      onComplete?.();
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to CallTrack</CardTitle>
          <CardDescription>
            Let's get you set up in just a few steps
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <button
                    onClick={() => setCurrentStep(index)}
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      index === currentStep
                        ? 'border-primary bg-primary text-primary-foreground'
                        : completedSteps.has(index)
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-muted bg-background text-muted-foreground'
                    }`}
                  >
                    {completedSteps.has(index) ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </button>
                  <div className="mt-2 text-center">
                    <p className={`text-xs font-medium ${
                      index === currentStep ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    completedSteps.has(index) ? 'bg-green-500' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Current Step Content */}
          <div className="min-h-[400px] py-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold">{steps[currentStep].title}</h2>
              <p className="text-muted-foreground mt-1">
                {steps[currentStep].description}
              </p>
            </div>
            <CurrentStepComponent
              onComplete={() => handleStepComplete(currentStep)}
              onNext={handleNext}
            />
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentStep === steps.length - 1 && !completedSteps.has(currentStep)}
            >
              {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
              {currentStep < steps.length - 1 && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

