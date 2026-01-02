import { useParams } from "wouter";
import { LayoutShell } from "@/components/layout-shell";
import { useAssistant } from "@/hooks/use-assistants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Loader2, 
  Shield,
  Cloud,
  ChevronUp,
  ChevronDown,
  Check,
  AlertTriangle,
  Ban,
  Flame,
  Lock,
  Info
} from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const regions = [
  { id: 'us', code: 'US', name: 'United States', region: 'us-central1' },
  { id: 'eu', code: 'EU', name: 'Europe', region: 'europe-west3' },
];

const filterLevels = ['Off', 'Standard', 'Balanced', 'Strict'];

export default function SecurityPage() {
  const { id } = useParams();
  const assistantId = Number(id);
  
  const { data: assistant, isLoading } = useAssistant(assistantId);

  const [isCloudOpen, setIsCloudOpen] = useState(true);
  const [isGuardrailsOpen, setIsGuardrailsOpen] = useState(true);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(true);

  const [selectedRegion, setSelectedRegion] = useState('us');
  const [cloudAuditLogging, setCloudAuditLogging] = useState(false);
  const [anonymizePatrons, setAnonymizePatrons] = useState(true);
  
  const [harassmentFilter, setHarassmentFilter] = useState('Balanced');
  const [hateSpeechFilter, setHateSpeechFilter] = useState('Balanced');
  const [sexualFilter, setSexualFilter] = useState('Standard');
  const [dangerousFilter, setDangerousFilter] = useState('Balanced');
  
  const [sessionOnlyStorage, setSessionOnlyStorage] = useState(true);

  const [isCommitting, setIsCommitting] = useState(false);

  const handleCommit = async () => {
    setIsCommitting(true);
    // Simulate saving
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsCommitting(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <LayoutShell assistantId={assistantId}>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Trust & Safety</h1>
          <p className="text-sm text-muted-foreground">
            Enterprise-grade privacy safeguards and Google Cloud security integration.
          </p>
        </div>

        <div className="max-w-4xl space-y-6">
          {/* Google Cloud Sovereignty */}
          <Collapsible open={isCloudOpen} onOpenChange={setIsCloudOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer flex flex-row items-center justify-between gap-2 py-4">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-blue-500" />
                    Google Cloud Sovereignty
                  </CardTitle>
                  {isCloudOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Data Residency Region */}
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <span className="w-3 h-3 rounded bg-muted" />
                        Data Residency Region
                      </Label>
                      <div className="space-y-2">
                        {regions.map((region) => (
                          <button
                            key={region.id}
                            onClick={() => setSelectedRegion(region.id)}
                            className={`w-full p-3 rounded-lg border-2 text-left transition-all flex items-center justify-between ${
                              selectedRegion === region.id 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-primary/50'
                            }`}
                            data-testid={`button-region-${region.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded">
                                {region.code}
                              </span>
                              <span className="text-sm">
                                {region.name} <span className="text-muted-foreground">({region.region})</span>
                              </span>
                            </div>
                            {selectedRegion === region.id && (
                              <Check className="w-4 h-4 text-primary" />
                            )}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Determines where Gemini API requests are processed for compliance.
                      </p>
                    </div>

                    {/* Cloud Options */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Cloud Audit Logging</p>
                          <p className="text-xs text-muted-foreground">
                            Export security events to Cloud Logging.
                          </p>
                        </div>
                        <Switch 
                          checked={cloudAuditLogging} 
                          onCheckedChange={setCloudAuditLogging}
                          data-testid="switch-audit-logging"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Anonymize Patrons</p>
                          <p className="text-xs text-muted-foreground">
                            Automatic PII masking (Emails, Phones).
                          </p>
                        </div>
                        <Switch 
                          checked={anonymizePatrons} 
                          onCheckedChange={setAnonymizePatrons}
                          data-testid="switch-anonymize"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Gemini Content Guardrails */}
          <Collapsible open={isGuardrailsOpen} onOpenChange={setIsGuardrailsOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer flex flex-row items-center justify-between gap-2 py-4">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-500" />
                    Gemini Content Guardrails
                  </CardTitle>
                  {isGuardrailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Harassment */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3" />
                        Harassment
                      </Label>
                      <Select value={harassmentFilter} onValueChange={setHarassmentFilter}>
                        <SelectTrigger data-testid="select-harassment">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {filterLevels.map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Hate Speech */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <Ban className="w-3 h-3" />
                        Hate Speech
                      </Label>
                      <Select value={hateSpeechFilter} onValueChange={setHateSpeechFilter}>
                        <SelectTrigger data-testid="select-hate-speech">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {filterLevels.map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sexually Explicit */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3" />
                        Sexually Explicit
                      </Label>
                      <Select value={sexualFilter} onValueChange={setSexualFilter}>
                        <SelectTrigger data-testid="select-sexual">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {filterLevels.map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Dangerous Content */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <Flame className="w-3 h-3" />
                        Dangerous Content
                      </Label>
                      <Select value={dangerousFilter} onValueChange={setDangerousFilter}>
                        <SelectTrigger data-testid="select-dangerous">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {filterLevels.map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-amber-50/50 rounded-lg border border-amber-100">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">
                      <strong>Note:</strong> Library bots typically require <strong>Balanced</strong> or <strong>Strict</strong> filtering to maintain institutional neutrality and safety for all age groups.
                    </p>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Patron Privacy Mode */}
          <Collapsible open={isPrivacyOpen} onOpenChange={setIsPrivacyOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer flex flex-row items-center justify-between gap-2 py-4">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4 text-green-500" />
                    Patron Privacy Mode
                  </CardTitle>
                  {isPrivacyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-semibold text-sm">Session-Only Storage</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-md">
                        Dialogue history is wiped immediately after the patron closes the browser tab. No conversation data is persisted on ChatLib servers.
                      </p>
                    </div>
                    <Switch 
                      checked={sessionOnlyStorage} 
                      onCheckedChange={setSessionOnlyStorage}
                      data-testid="switch-session-only"
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Commit Security Config Button */}
          <div className="flex justify-center pt-4">
            <Button 
              size="lg" 
              onClick={handleCommit}
              disabled={isCommitting}
              className="px-8"
              data-testid="button-commit-security"
            >
              {isCommitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Shield className="w-4 h-4 mr-2" />
              )}
              Commit Security Config
            </Button>
          </div>
        </div>
      </div>
    </LayoutShell>
  );
}
