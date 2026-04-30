import * as React from 'react';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  url: string | null;
  filename?: string;
}

export const DocumentPreviewDialog: React.FC<Props> = ({ open, onOpenChange, url, filename }) => {
  const isImage = url && /\.(png|jpg|jpeg|webp|gif)(\?|$)/i.test(url);
  const isPdf = url && /\.pdf(\?|$)/i.test(url);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b bg-card">
          <p className="text-sm font-medium truncate flex-1">{filename || 'Document'}</p>
          <div className="flex items-center gap-1">
            {url && (
              <Button asChild variant="outline" size="sm" className="gap-1">
                <a href={url} target="_blank" rel="noreferrer" download>
                  <Download className="w-4 h-4" /> Télécharger
                </a>
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 bg-muted overflow-auto h-full">
          {!url ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Aucun aperçu disponible</p>
          ) : isImage ? (
            <img src={url} alt={filename} className="w-full h-full object-contain" />
          ) : isPdf ? (
            <iframe src={url} title={filename} className="w-full h-full" />
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground mb-3">Aperçu non disponible pour ce type de fichier.</p>
              <Button asChild><a href={url} target="_blank" rel="noreferrer">Ouvrir dans un nouvel onglet</a></Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
