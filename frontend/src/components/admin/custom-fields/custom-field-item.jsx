"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Type, Image as ImageIcon } from "lucide-react";

export default function CustomFieldItem({
  field,
  index,
  imagePreview,
  onFieldChange,
  onFileUpload,
  onRemove,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-6 rounded-lg dark:bg-zinc-800/50 border border-border/50 dark:shadow-xl dark:shadow-black/10"
    >
      <div className="flex items-center justify-between mb-4">
        <Label htmlFor={`type-${index}`} className="text-lg font-semibold">
          Field Type
        </Label>
        <Button
          type="button"
          onClick={() => onRemove(index)}
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-4">
        <Select
          value={field.type}
          onValueChange={(value) => onFieldChange(index, "type", value)}
        >
          <SelectTrigger className="h-12 bg-background/50 border-input/50 dark:bg-zinc-800/50">
            <SelectValue placeholder="Select field type" />
          </SelectTrigger>
          <SelectContent className="dark:bg-zinc-800 border-border/50">
            <SelectItem value="content" className="focus:bg-primary/20">
              <span className="flex items-center">
                <Type className="mr-2 h-4 w-4 text-primary" />
                Content
              </span>
            </SelectItem>
            <SelectItem value="image" className="focus:bg-primary/20">
              <span className="flex items-center">
                <ImageIcon className="mr-2 h-4 w-4 text-primary" />
                Image
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="space-y-2">
          <Label htmlFor={`key-${index}`} className="text-lg font-semibold">
            Field Key
          </Label>
          <Input
            id={`key-${index}`}
            value={field.key}
            onChange={(e) => onFieldChange(index, "key", e.target.value)}
            className="h-12 bg-background/50 border-input/50 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-zinc-800/50"
            placeholder="Enter field key"
            required
          />
        </div>

        {field.type === "content" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <Label htmlFor={`value-${index}`} className="text-lg font-semibold">
              Field Value
            </Label>
            <Textarea
              id={`value-${index}`}
              value={field.value}
              onChange={(e) => onFieldChange(index, "value", e.target.value)}
              className="min-h-[120px] bg-background/50 border-input/50 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-zinc-800/50"
              placeholder="Enter field value"
              required
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <Label htmlFor={`image-${index}`} className="text-lg font-semibold">
              Upload Image
            </Label>
            <div className="relative">
              <Input
                id={`image-${index}`}
                type="file"
                accept="image/*"
                onChange={(e) => onFileUpload(index, e.target.files[0])}
                className="h-12 bg-background/50 border-input/50 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-zinc-800/50"
              />
              {imagePreview && (
                <div className="mt-4 relative group rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-foreground hover:text-destructive"
                      onClick={() => onFieldChange(index, "value", "")}
                    >
                      <X className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
