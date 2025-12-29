import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, ChevronDown, ChevronUp, Save, FolderOpen, Trash2, Loader2, FileSpreadsheet, MapPin, Phone, Globe, Navigation } from 'lucide-react';
import { MUVO_FIELDS, MuvoFieldDefinition, ColumnMapping, MappingPreset } from '@/types/bulkImport';
import { useToast } from '@/hooks/use-toast';

interface ImportMappingStepProps {
  fileName: string;
  sourceColumns: string[];
  rowCount: number;
  columnMapping: ColumnMapping;
  onUpdateMapping: (muvoField: string, sourceColumn: string | null) => void;
  onSavePreset: (name: string) => MappingPreset;
  onLoadPreset: (preset: MappingPreset) => void;
  onDeletePreset: (presetId: string) => void;
  getPresets: () => MappingPreset[];
  onNext: () => void;
  onBack: () => void;
  isProcessing: boolean;
}

const FIELD_GROUPS = [
  { key: 'basic', label: 'Basic Info', icon: FileSpreadsheet },
  { key: 'location', label: 'Location', icon: MapPin },
  { key: 'contact', label: 'Contact', icon: Phone },
  { key: 'external', label: 'External References', icon: Globe },
  { key: 'entrance', label: 'Entrances (Optional)', icon: Navigation },
] as const;

export function ImportMappingStep({
  fileName,
  sourceColumns,
  rowCount,
  columnMapping,
  onUpdateMapping,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  getPresets,
  onNext,
  onBack,
  isProcessing,
}: ImportMappingStepProps) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['basic', 'location']);
  const [presetName, setPresetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const { toast } = useToast();

  const presets = getPresets();

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupKey)
        ? prev.filter(g => g !== groupKey)
        : [...prev, groupKey]
    );
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast({ title: 'Please enter a preset name', variant: 'destructive' });
      return;
    }
    onSavePreset(presetName.trim());
    setPresetName('');
    setShowSaveDialog(false);
    toast({ title: 'Preset saved', description: `"${presetName}" saved for future imports` });
  };

  const handleLoadPreset = (preset: MappingPreset) => {
    onLoadPreset(preset);
    setShowLoadDialog(false);
    toast({ title: 'Preset loaded', description: `Applied "${preset.name}" mapping` });
  };

  const handleDeletePreset = (preset: MappingPreset) => {
    onDeletePreset(preset.id);
    toast({ title: 'Preset deleted' });
  };

  const getFieldsByGroup = (groupKey: string): MuvoFieldDefinition[] => {
    return MUVO_FIELDS.filter(f => f.group === groupKey);
  };

  const getMappedCount = (groupKey: string): number => {
    return getFieldsByGroup(groupKey).filter(f => columnMapping[f.key]).length;
  };

  const requiredFields = MUVO_FIELDS.filter(f => f.required);
  const allRequiredMapped = requiredFields.every(f => columnMapping[f.key]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Step 2: Map Columns
            </CardTitle>
            <CardDescription className="mt-1">
              <span className="font-medium">{fileName}</span> • {rowCount} rows • {sourceColumns.length} columns detected
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={presets.length === 0}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Load Preset
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Load Mapping Preset</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-64">
                  <div className="space-y-2">
                    {presets.map(preset => (
                      <div key={preset.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{preset.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(preset.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleLoadPreset(preset)}>
                            Load
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeletePreset(preset)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>

            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save Preset
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Mapping Preset</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Preset Name</Label>
                    <Input
                      value={presetName}
                      onChange={e => setPresetName(e.target.value)}
                      placeholder="e.g., iOverlander Export, Partner A Format"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
                  <Button onClick={handleSavePreset}>Save Preset</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground mb-4">
          Map your file columns to MUVO fields. Required fields are marked with <span className="text-destructive">*</span>
        </div>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {FIELD_GROUPS.map(group => {
              const GroupIcon = group.icon;
              const fields = getFieldsByGroup(group.key);
              const mappedCount = getMappedCount(group.key);
              const isExpanded = expandedGroups.includes(group.key);

              return (
                <Collapsible
                  key={group.key}
                  open={isExpanded}
                  onOpenChange={() => toggleGroup(group.key)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <div className="flex items-center gap-2">
                      <GroupIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{group.label}</span>
                      {mappedCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {mappedCount} mapped
                        </Badge>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3 pb-2 px-2">
                    <div className="space-y-3">
                      {fields.map(field => (
                        <div key={field.key} className="flex items-center gap-3">
                          <div className="w-48 flex-shrink-0">
                            <Label className="text-sm">
                              {field.label}
                              {field.required && <span className="text-destructive ml-1">*</span>}
                            </Label>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <Select
                            value={columnMapping[field.key] || '_none_'}
                            onValueChange={val => onUpdateMapping(field.key, val === '_none_' ? null : val)}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select column..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_none_">(none)</SelectItem>
                              <Separator className="my-1" />
                              {sourceColumns.map(col => (
                                <SelectItem key={col} value={col}>
                                  {col}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>

        <Separator />

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <div className="flex items-center gap-3">
            {!allRequiredMapped && (
              <span className="text-sm text-destructive">
                Map all required fields to continue
              </span>
            )}
            <Button onClick={onNext} disabled={!allRequiredMapped || isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Validate & Preview
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
