# Vendors Components

This directory contains components for managing vendors in the application.

## Components

### VendorListFactory

A dynamic list component for displaying and managing vendors, created using the `createDynamicList` factory function.

```jsx
import VendorListFactory from '@/components/admin/vendors/vendor-list-factory'

export default function VendorsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <VendorListFactory />
    </div>
  )
}
```

### VendorListDynamic

An alternative implementation of the vendors list using the `DynamicList` component directly.

```jsx
import VendorListDynamic from '@/components/admin/vendors/vendor-list-dynamic'

export default function VendorsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <VendorListDynamic />
    </div>
  )
}
```

### CreateVendor

A modal component for creating new vendors.

### EditVendor

A modal component for editing existing vendors.

## Data Structure

The vendor data structure includes:

```javascript
{
  "id": "cm7lg0yi3000479yp1f7yos3y",
  "businessName": "Express Transport Co.",
  "businessEmail": "info@expresstransport.com",
  "businessMobile": "+1 (555) 123-4567",
  "businessAddress": "123 Main Street, Los Angeles, CA 90001",
  "businessLogo": "/uploads/logos/express-transport.png",
  "status": "ACTIVE",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@expresstransport.com",
  "createdAt": "2025-02-26T04:56:34.469Z",
  "updatedAt": "2025-02-26T04:56:34.469Z"
}
```

## API Response Format

The API returns data in the following format:

```javascript
{
  "vendors": [
    // Array of vendor objects as described above
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

## API Endpoints

The components interact with the following API endpoints:

- `GET /vendors` - Get all vendors with pagination
- `POST /vendors` - Create a new vendor
- `GET /vendors/:id` - Get a specific vendor
- `PUT /vendors/:id` - Update a vendor
- `DELETE /vendors/:id` - Delete a vendor

## Usage with Dynamic List

The vendors components leverage the common dynamic list components for consistent UI and behavior. The implementation includes:

1. Column definitions for the vendor data
2. Custom rendering for each column type
3. Integration with create and edit modals
4. Custom actions for vendor-specific operations
5. Status handling with appropriate colors

See the [Dynamic List Components documentation](../../common/README.md) for more details on the underlying implementation. 