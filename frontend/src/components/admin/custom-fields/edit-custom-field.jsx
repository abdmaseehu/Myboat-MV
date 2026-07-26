"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import CustomFieldItem from "./custom-field-item";

export default function EditCustomField({ customField, onSuccess }) {
  const [name, setName] = useState(customField.name);
  const [customFields, setCustomFields] = useState(
    customField.customFields.map((field) => ({
      ...field,
      value: field.type === "image" ? field.imagePath || "" : field.value || "",
    }))
  );
  const [imagePreviews, setImagePreviews] = useState(
    (customField.customFields || []).map((field) =>
      field.type === "image" && field.imagePath
        ? `${process.env.NEXT_PUBLIC_ROOT_URL}/uploads/${field.imagePath}`
        : null
    )
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

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
    updatedFields[index].imagePath = null; // Clear the old image path
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
        if (field.value instanceof File) {
          formData.append(fileKey, field.value);
          return { key: field.key, type: field.type };
        } else {
          // If no new file was uploaded, keep the existing image path
          return {
            key: field.key,
            type: field.type,
            imagePath: field.imagePath,
          };
        }
      } else {
        return {
          key: field.key,
          type: field.type,
          value: field.value,
        };
      }
    });

    formData.append("customFields", JSON.stringify(formattedFields));

    try {
      await api.put(`/custom-fields/${customField.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Custom field updated successfully!");
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update custom field"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNew = async (e) => {
    e.preventDefault();
    setIsCreatingNew(true);

    try {
      const formData = new FormData();
      formData.append("name", name);

      const formattedFields = customFields.map((field, index) => {
        if (field.type === "image") {
          const fileKey = `customFields[${index}][image]`;
          if (field.value instanceof File) {
            formData.append(fileKey, field.value);
          }
          return { key: field.key, type: field.type };
        }
        return {
          key: field.key,
          type: field.type,
          value: field.value,
        };
      });

      formData.append("customFields", JSON.stringify(formattedFields));

      await api.post("/custom-fields", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("New custom field created successfully!");
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create custom field"
      );
    } finally {
      setIsCreatingNew(false);
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
                <CustomFieldItem
                  key={index}
                  field={field}
                  index={index}
                  imagePreview={imagePreviews[index]}
                  onFieldChange={handleCustomFieldChange}
                  onFileUpload={handleFileUpload}
                  onRemove={removeCustomField}
                />
              ))}
            </AnimatePresence>

            <Button
              type="button"
              onClick={addCustomField}
              variant="outline"
              className="w-full h-14 text-base border-2 border-dashed border-primary/20 hover:border-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" /> Add Custom Field
            </Button>

            <div className="flex flex-col gap-4">
              <Button
                type="submit"
                disabled={isSubmitting || isCreatingNew}
                className="w-full h-14 text-base bg-sky-500 hover:bg-sky-600 text-white shadow-lg hover:shadow-xl transition-all dark:shadow-sky-500/30"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Update Custom Field
                  </>
                )}
              </Button>

              <Button
                type="button"
                onClick={handleCreateNew}
                disabled={isCreatingNew || isSubmitting}
                className="w-full h-14 text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all dark:shadow-primary/30"
              >
                {isCreatingNew ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2" />
                    Create as New Custom Field
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
