"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, Plus, Type, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

export default function CreateCustomField({ onSuccess }) {
  const [name, setName] = useState("");
  const [customFields, setCustomFields] = useState([
    { type: "content", key: "", value: "" },
  ]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handleCustomFieldChange = (index, field, value) => {
    const updatedFields = [...customFields];
    updatedFields[index][field] = value;
    setCustomFields(updatedFields);
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { type: "content", key: "", value: "" }]);
  };

  const removeCustomField = (index) => {
    const updatedFields = customFields.filter((_, idx) => idx !== index);
    setCustomFields(updatedFields);
    setImagePreviews((prev) => {
      const newPreviews = [...prev];
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  const handleFileUpload = (index, file) => {
    const updatedFields = [...customFields];
    updatedFields[index].value = file;
    setCustomFields(updatedFields);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviews((prev) => {
        const newPreviews = [...prev];
        newPreviews[index] = reader.result;
        return newPreviews;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("name", name);

    const formattedFields = customFields.map((field, index) => {
      if (field.type === "image") {
        const fileKey = `customFields[${index}][image]`;
        formData.append(fileKey, field.value);
        return { key: field.key, type: field.type };
      } else {
        return { key: field.key, type: field.type, value: field.value };
      }
    });

    formData.append("customFields", JSON.stringify(formattedFields));

    try {
      await api.post("/custom-fields", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Custom field created successfully!");
      if (onSuccess) onSuccess();
      setName("");
      setCustomFields([{ type: "content", key: "", value: "" }]);
      setImagePreviews([]);
    } catch (error) {
      console.error("Error saving data:", error);
      toast.error(
        error.response?.data?.message || "Failed to create custom field"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      <Card className="border-border/50 shadow-lg dark:shadow-2xl dark:shadow-primary/10 dark:bg-zinc-900">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-lg font-semibold">
                Model Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={handleNameChange}
                className="h-12 bg-background/50 border-input/50 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-zinc-800/50"
                placeholder="Enter model name"
                required
              />
            </div>

            <AnimatePresence>
              {customFields.map((field, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 rounded-lg dark:bg-zinc-800/50 border border-border/50 dark:shadow-xl dark:shadow-black/10"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Label
                      htmlFor={`type-${index}`}
                      className="text-lg font-semibold"
                    >
                      Field Type
                    </Label>
                    <Button
                      type="button"
                      onClick={() => removeCustomField(index)}
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
                      onValueChange={(value) =>
                        handleCustomFieldChange(index, "type", value)
                      }
                    >
                      <SelectTrigger className="h-12 bg-background/50 border-input/50 dark:bg-zinc-800/50">
                        <SelectValue placeholder="Select field type" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-zinc-800 border-border/50">
                        <SelectItem
                          value="content"
                          className="focus:bg-primary/20"
                        >
                          <span className="flex items-center">
                            <Type className="mr-2 h-4 w-4 text-primary" />
                            Content
                          </span>
                        </SelectItem>
                        <SelectItem
                          value="image"
                          className="focus:bg-primary/20"
                        >
                          <span className="flex items-center">
                            <ImageIcon className="mr-2 h-4 w-4 text-primary" />
                            Image
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="space-y-2">
                      <Label
                        htmlFor={`key-${index}`}
                        className="text-lg font-semibold"
                      >
                        Field Key
                      </Label>
                      <Input
                        id={`key-${index}`}
                        value={field.key}
                        onChange={(e) =>
                          handleCustomFieldChange(index, "key", e.target.value)
                        }
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
                        <Label
                          htmlFor={`value-${index}`}
                          className="text-lg font-semibold"
                        >
                          Field Value
                        </Label>
                        <Textarea
                          id={`value-${index}`}
                          value={field.value}
                          onChange={(e) =>
                            handleCustomFieldChange(
                              index,
                              "value",
                              e.target.value
                            )
                          }
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
                        <Label
                          htmlFor={`image-${index}`}
                          className="text-lg font-semibold"
                        >
                          Upload Image
                        </Label>
                        <div className="relative">
                          <Input
                            id={`image-${index}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleFileUpload(index, e.target.files[0])
                            }
                            className="h-12 bg-background/50 border-input/50 focus:border-primary focus:ring-1 focus:ring-primary dark:bg-zinc-800/50"
                            required={!field.value}
                          />
                          {imagePreviews[index] && (
                            <div className="mt-4 relative group rounded-lg overflow-hidden">
                              <img
                                src={imagePreviews[index]}
                                alt="Preview"
                                className="w-full h-48 object-cover rounded-lg"
                              />
                              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="text-foreground hover:text-destructive"
                                  onClick={() => {
                                    handleCustomFieldChange(index, "value", "");
                                    setImagePreviews((prev) => {
                                      const newPreviews = [...prev];
                                      newPreviews[index] = null;
                                      return newPreviews;
                                    });
                                  }}
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
              ))}
            </AnimatePresence>

            <div className="flex flex-col gap-4">
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button
                  type="button"
                  onClick={addCustomField}
                  variant="outline"
                  className="w-full h-14 text-base border-2 border-dashed border-primary/20 hover:border-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" /> Add Custom Field
                </Button>
              </motion.div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all dark:shadow-primary/30"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Custom Field"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => {
                  setName("");
                  setCustomFields([{ type: "content", key: "", value: "" }]);
                  setImagePreviews([]);
                }}
                className="w-full h-14 text-base border-input/50 hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
              >
                Clear Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <AnimatePresence>
        {showModal && (
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{modalContent.title}</DialogTitle>
                <DialogDescription>{modalContent.message}</DialogDescription>
              </DialogHeader>
              <Button
                onClick={() => setShowModal(false)}
                className="bg-sky-500 hover:bg-sky-600 text-white"
              >
                Close
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
