"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DynamicList from "./dynamic-list";
import api from "@/lib/axios";

/**
 * Factory function to create a dynamic list component for any entity
 * 
 * @param {Object} config - Configuration for the dynamic list
 * @param {string} config.title - Title of the list (e.g., "Users", "Products")
 * @param {string} config.apiEndpoint - API endpoint for fetching data
 * @param {Array} config.columns - Column definitions
 * @param {Function} config.renderRow - Function to render row data
 * @param {Array} config.breadcrumbs - Breadcrumb items
 * @param {Object} config.createConfig - Configuration for create functionality
 * @param {Component} config.CreateModal - Create modal component
 * @param {Component} config.EditModal - Edit modal component
 * @param {string} config.detailsPath - Path pattern for details page (e.g., "/admin/users/:id")
 * @param {Array} config.customActions - Additional custom actions
 * @param {string} config.searchPlaceholder - Placeholder for search input
 * @param {string} config.deleteEndpoint - API endpoint pattern for delete (e.g., "/auth/:id")
 * @returns {Function} - Dynamic list component
 */
export default function createDynamicList({
  title,
  apiEndpoint,
  columns,
  renderRow,
  breadcrumbs = [],
  createConfig = {
    show: true,
    label: `Create New ${title.slice(0, -1)}`,
  },
  CreateModal,
  EditModal,
  detailsPath,
  customActions = [],
  searchPlaceholder = `Search ${title.toLowerCase()}...`,
  deleteEndpoint,
  EditMode
}) {
  // Return a component
  return function DynamicListComponent() {
    const router = useRouter();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Handle edit
    const handleEdit = (item) => {
      setSelectedItem(item);
      setShowEditModal(true);
    };

    // Handle delete
    const handleDelete = async (item) => {
      try {
        const endpoint = deleteEndpoint
          ? deleteEndpoint.replace(":id", item.id)
          : `${apiEndpoint}/${item.id}`;
        await api.delete(endpoint);
        return true;
      } catch (error) {
        return false;
      }
    };

    // Handle success (refresh data)
    const handleSuccess = () => {
      setRefreshTrigger((prev) => prev + 1);
    };

    // Build actions
    const actions = [...customActions];
    
    // Add view details action if detailsPath is provided
    if (detailsPath) {
      actions.unshift({
        label: "View Details",
        onClick: (item) => router.push(detailsPath.replace(":id", item.id)),
        className: "text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer",
      });
    }

    return (
      <>
        <DynamicList
          title={title}
          apiEndpoint={apiEndpoint}
          columns={columns}
          renderRow={renderRow}
          breadcrumbs={breadcrumbs}
          createButton={{
            show: createConfig.show && !!CreateModal,
            label: createConfig.label,
            onClick: () => setShowCreateModal(true),
          }}
          
          onEdit={handleEdit}
          onDelete={handleDelete}
          customActions={actions}
          searchPlaceholder={searchPlaceholder}
          refreshTrigger={refreshTrigger}
          EditMode={EditMode}
        />

        {/* Create Modal */}
        {CreateModal && (
          <CreateModal
            open={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleSuccess}
          />
        )}

        {/* Edit Modal */}
        {EditModal && selectedItem && (
          <EditModal
            item={selectedItem}
            open={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedItem(null);
            }}
            onSuccess={handleSuccess}
          />
        )}
      </>
    );
  };
} 