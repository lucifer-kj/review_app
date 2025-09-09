# Enhanced User Management System

## Overview
This enhanced user management system provides comprehensive user administration capabilities for the Crux platform, allowing super admins to manage users across tenants with full control over roles, permissions, and access.

## Features Implemented

### 1. User Tenant Assignment
- **Move users between tenants**: Assign users to any active tenant
- **Remove users from tenants**: Remove users from their current tenant
- **Role assignment**: Set appropriate roles (tenant_admin or user) when assigning to tenants
- **Visual tenant selection**: Search and select from available tenants with user counts

### 2. User Role Management
- **Role promotion/demotion**: Change user roles between super_admin, tenant_admin, and user
- **Role validation**: Prevent invalid role changes with appropriate warnings
- **Visual role indicators**: Clear icons and descriptions for each role level
- **Permission preview**: Show what permissions each role provides

### 3. User Status Management
- **Ban/Unban users**: Temporarily or permanently ban users from the platform
- **Suspend/Unsuspend users**: Temporarily restrict user access without permanent banning
- **Status indicators**: Visual badges showing user status (banned, suspended, unverified)
- **Bulk operations**: Support for multiple user management actions

### 4. Enhanced User Interface
- **Modal-based workflows**: Clean, focused interfaces for complex operations
- **Real-time updates**: Immediate feedback and data refresh after operations
- **Search and filtering**: Find users quickly with email-based search
- **Responsive design**: Works on all device sizes

## Components

### UserManagement.tsx
Main user management interface with:
- User listing with pagination
- Search functionality
- Action dropdown menus
- Status indicators
- Modal integration

### TenantSelectionModal.tsx
Modal for tenant assignment with:
- Tenant search and filtering
- Role selection (tenant_admin/user)
- Current assignment display
- Remove from tenant option

### UserRoleModal.tsx
Modal for role changes with:
- Current role display
- New role selection
- Permission descriptions
- Change warnings

### UserManagementService.ts
Enhanced service with methods for:
- `moveUserToTenant()` - Move users between tenants
- `promoteUser()` - Change user roles
- `banUser()` / `unbanUser()` - User banning
- `suspendUser()` / `unsuspendUser()` - User suspension

## Usage

### Moving Users Between Tenants
1. Click the "Move to Different Tenant" option in the user dropdown
2. Search and select the target tenant
3. Choose the appropriate role (tenant_admin or user)
4. Confirm the assignment

### Changing User Roles
1. Click the "Change Role" option in the user dropdown
2. Select the new role from the dropdown
3. Review the permission changes
4. Confirm the role change

### Banning/Suspending Users
1. Use the existing ban/suspend options in the dropdown
2. Users will be immediately restricted from platform access
3. Use unban/unsuspend to restore access

## Security Considerations

- All operations require super_admin privileges
- User metadata is updated in both profiles and auth.users tables
- Audit trails are maintained for all user management actions
- Role changes are validated to prevent privilege escalation issues

## Database Schema Requirements

The system requires the following tables:
- `profiles` - User profile information with tenant_id and role
- `tenants` - Tenant information for assignment
- `auth.users` - Supabase auth users table

## Error Handling

- Comprehensive error handling with user-friendly messages
- Toast notifications for success/failure feedback
- Graceful degradation for non-critical operations
- Detailed error logging for debugging

## Future Enhancements

- Bulk user operations
- Advanced filtering and sorting
- User activity monitoring
- Automated role assignment rules
- Integration with external user directories
