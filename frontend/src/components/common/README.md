# Dynamic List Components

This directory contains reusable components for creating dynamic lists with common features like pagination, search, and CRUD operations.

## Components

### DynamicList

A flexible component for displaying data in a table with pagination, search, and action buttons.

```jsx
import DynamicList from "@/components/common/dynamic-list";

export default function MyList() {
  // Column definitions
  const columns = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    // ...
  ];

  // Render row data based on column key
  const renderRow = (item, columnKey) => {
    switch (columnKey) {
      case "name":
        return <div>{item.name}</div>;
      case "email":
        return <div>{item.email}</div>;
      // ...
      default:
        return null;
    }
  };

  return (
    <DynamicList
      title="Items"
      apiEndpoint="/api/items"
      columns={columns}
      renderRow={renderRow}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Items", href: "/items" }
      ]}
      createButton={{
        show: true,
        label: "Create New Item",
        onClick: () => setShowCreateModal(true),
      }}
      onEdit={(item) => {/* Handle edit */}}
      onDelete={async (item) => {/* Handle delete */}}
      customActions={[
        {
          label: "View Details",
          onClick: (item) => {/* Handle view details */},
          className: "text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer",
        },
      ]}
      searchPlaceholder="Search items..."
    />
  );
}
```

### createDynamicList

A factory function to easily create dynamic list components for different entities.

```jsx
import createDynamicList from "@/components/common/create-dynamic-list";
import CreateModal from "./create-modal";
import EditModal from "./edit-modal";

// Column definitions
const columns = [
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  // ...
];

// Render row data based on column key
const renderRow = (item, columnKey) => {
  switch (columnKey) {
    case "name":
      return <div>{item.name}</div>;
    case "email":
      return <div>{item.email}</div>;
    // ...
    default:
      return null;
  }
};

// Create the dynamic list component
const MyListComponent = createDynamicList({
  title: "Items",
  apiEndpoint: "/api/items",
  columns,
  renderRow,
  breadcrumbs: ["Dashboard", "Items"],
  createConfig: {
    show: true,
    label: "Create New Item",
  },
  CreateModal,
  EditModal,
  detailsPath: "/admin/items/:id",
  customActions: [
    {
      label: "Custom Action",
      onClick: (item) => {/* Handle custom action */},
      className: "text-purple-600 hover:text-purple-700 hover:bg-purple-50 cursor-pointer",
    },
  ],
  searchPlaceholder: "Search items...",
  deleteEndpoint: "/api/items/:id",
});

export default MyListComponent;
```

## API Reference

### DynamicList Props

| Prop | Type | Description |
|------|------|-------------|
| `title` | string | Title of the list |
| `apiEndpoint` | string | API endpoint for fetching data |
| `columns` | array | Column definitions with `key` and `header` properties |
| `renderRow` | function | Function to render row data based on column key |
| `breadcrumbs` | array | Breadcrumb items with `label` and `href` properties for navigation |
| `createButton` | object | Configuration for create button |
| `onEdit` | function | Function to handle edit action |
| `onDelete` | function | Function to handle delete action |
| `customActions` | array | Additional custom actions |
| `pageSize` | number | Default page size |
| `searchPlaceholder` | string | Placeholder for search input |
| `searchField` | string | Field name for search parameter |
| `refreshTrigger` | number | Value to trigger data refresh |

### createDynamicList Options

| Option | Type | Description |
|--------|------|-------------|
| `title` | string | Title of the list |
| `apiEndpoint` | string | API endpoint for fetching data |
| `columns` | array | Column definitions with `key` and `header` properties |
| `renderRow` | function | Function to render row data based on column key |
| `breadcrumbs` | array | Breadcrumb items |
| `createConfig` | object | Configuration for create functionality |
| `CreateModal` | component | Create modal component |
| `EditModal` | component | Edit modal component |
| `detailsPath` | string | Path pattern for details page |
| `customActions` | array | Additional custom actions |
| `searchPlaceholder` | string | Placeholder for search input |
| `deleteEndpoint` | string | API endpoint pattern for delete |

## Example Usage

### Creating a User List

```jsx
import createDynamicList from "@/components/common/create-dynamic-list";
import CreateUser from "./create-user";
import EditUser from "./edit-user";

// Create a custom EditUser wrapper that accepts 'item' prop instead of 'user'
const EditUserWrapper = ({ item, ...props }) => {
  return <EditUser user={item} {...props} />;
};

// Create the dynamic user list component
const UserList = createDynamicList({
  title: "Users",
  apiEndpoint: "/api/users",
  columns: [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "role", header: "Role" },
  ],
  renderRow: (user, columnKey) => {
    switch (columnKey) {
      case "name":
        return <div>{user.name}</div>;
      case "email":
        return <div>{user.email}</div>;
      case "role":
        return <div>{user.role}</div>;
      default:
        return null;
    }
  },
  breadcrumbs: ["Dashboard", "Users"],
  CreateModal: CreateUser,
  EditModal: EditUserWrapper,
  detailsPath: "/admin/users/:id",
});

export default UserList;
```

## API Response Formats

The DynamicList component is designed to handle various API response formats:

### Standard Format
```javascript
{
  "data": {
    "items": [/* array of items */],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

### Entity-Specific Format
```javascript
{
  "data": {
    "users": [/* array of users */],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

### Meta Format
```javascript
{
  "data": [/* array of items */],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

The component automatically detects the format and extracts the data and pagination information accordingly, without requiring specific entity checks for each type of data. 