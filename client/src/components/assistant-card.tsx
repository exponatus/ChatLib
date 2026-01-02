import { Assistant } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  MoreHorizontal, 
  Pencil, 
  Image as ImageIcon, 
  RotateCcw,
  Clock,
  Star,
  Settings
} from "lucide-react";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useDeleteAssistant, useUpdateAssistant } from "@/hooks/use-assistants";
import { useState, useRef } from "react";

const pastelGradients = [
  "bg-gradient-to-br from-rose-200 via-pink-100 to-purple-200",
  "bg-gradient-to-br from-sky-200 via-cyan-100 to-blue-200",
  "bg-gradient-to-br from-amber-200 via-orange-100 to-yellow-200",
  "bg-gradient-to-br from-emerald-200 via-green-100 to-teal-200",
  "bg-gradient-to-br from-violet-200 via-purple-100 to-fuchsia-200",
  "bg-gradient-to-br from-lime-200 via-emerald-100 to-cyan-200",
  "bg-gradient-to-br from-pink-200 via-rose-100 to-red-200",
  "bg-gradient-to-br from-indigo-200 via-blue-100 to-sky-200",
];

function getGradient(id: number): string {
  return pastelGradients[id % pastelGradients.length];
}

export function AssistantCard({ assistant }: { assistant: Assistant }) {
  const { mutate: deleteAssistant, isPending } = useDeleteAssistant();
  const { mutateAsync: updateAssistant } = useUpdateAssistant();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newName, setNewName] = useState(assistant.name);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRename = async () => {
    if (newName.trim()) {
      await updateAssistant({ id: assistant.id, name: newName.trim() });
      setShowRenameDialog(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        await updateAssistant({ id: assistant.id, coverImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = async () => {
    await updateAssistant({ id: assistant.id, coverImage: null });
  };

  const formattedDate = new Date(assistant.createdAt).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <>
      <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 border-border/60">
        {/* Cover Image Area */}
        <div className={`relative h-32 flex items-center justify-center ${!assistant.coverImage ? getGradient(assistant.id) : ''}`}>
          {assistant.coverImage ? (
            <img 
              src={assistant.coverImage} 
              alt={assistant.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
              <span className="text-3xl font-bold text-white/80">{assistant.name.charAt(0).toUpperCase()}</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {assistant.isDemo ? (
              <Badge className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5">
                <Star className="w-3 h-3 mr-1" />
                DEMO
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-white/90 text-[10px] font-bold px-2 py-0.5">
                <span className="w-2 h-2 rounded-full bg-gray-400 mr-1.5" />
                DRAFT
              </Badge>
            )}
          </div>

          {/* Menu Button */}
          <div className="absolute top-3 right-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 bg-white/80 hover:bg-white"
                  data-testid={`button-menu-${assistant.id}`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowRenameDialog(true)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Change cover
                </DropdownMenuItem>
                {assistant.coverImage && (
                  <DropdownMenuItem onClick={handleRemoveImage}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Remove image
                  </DropdownMenuItem>
                )}
                {!assistant.isDemo && (
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onSelect={() => setShowDeleteDialog(true)}
                  >
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Assistant Name & ID */}
          <h3 className="text-lg font-semibold text-primary mb-1">{assistant.name}</h3>
          <p className="text-sm text-muted-foreground mb-4">{assistant.id}</p>

          {/* Created Date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
            <Link href={`/assistant/${assistant.id}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-manage-${assistant.id}`}>
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardContent>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handleCoverChange}
        />
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete 
              <strong> {assistant.name}</strong> and all associated documents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteAssistant(assistant.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete Assistant"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Assistant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Assistant name"
                data-testid="input-rename"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>Cancel</Button>
            <Button onClick={handleRename} data-testid="button-save-rename">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AddAssistantCard({ onClick }: { onClick: () => void }) {
  return (
    <Card 
      className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 border-dashed border-border cursor-pointer min-h-[240px] flex items-center justify-center"
      onClick={onClick}
      data-testid="card-add-assistant"
    >
      <div className="text-center p-6">
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mx-auto mb-4 group-hover:border-primary group-hover:text-primary transition-colors">
          <span className="text-2xl text-muted-foreground group-hover:text-primary">+</span>
        </div>
        <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
          Add Assistant
        </p>
      </div>
    </Card>
  );
}
