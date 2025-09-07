# Crux Review Management System - Developer Guide

## Table of Contents
1. [Development Setup](#development-setup)
2. [Project Structure](#project-structure)
3. [Coding Standards](#coding-standards)
4. [API Development](#api-development)
5. [Database Development](#database-development)
6. [Testing Guidelines](#testing-guidelines)
7. [Deployment Process](#deployment-process)
8. [Contributing](#contributing)

---

## Development Setup

### Prerequisites
- **Node.js**: Version 18.0.0 or higher
- **Package Manager**: npm, yarn, or bun
- **Git**: Version control
- **Supabase CLI**: For database management
- **VS Code**: Recommended IDE with extensions

### Required VS Code Extensions
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "supabase.supabase"
  ]
}
```

### Initial Setup
```bash
# Clone the repository
git clone https://github.com/your-org/crux-review-system.git
cd crux-review-system

# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local

# Start Supabase locally
supabase start

# Generate TypeScript types
supabase gen types typescript --local > src/types/supabase.ts

# Start development server
npm run dev
```

### Environment Configuration
```env
# Development Environment
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_local_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key

# Email Service (Development)
VITE_RESEND_API_KEY=your_resend_api_key

# Application Settings
VITE_APP_NAME="Crux Development"
VITE_SUPPORT_EMAIL="dev@crux.com"
VITE_FRONTEND_URL=http://localhost:5173
```

---

## Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # Reusable UI components (Shadcn/ui)
│   ├── auth/            # Authentication components
│   ├── master-dashboard/ # Master dashboard components
│   └── ...              # Feature-specific components
├── hooks/               # Custom React hooks
├── services/            # API and business logic services
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── constants/           # Application constants
├── integrations/        # Third-party integrations
└── pages/               # Page components

supabase/
├── migrations/          # Database migrations
├── functions/           # Edge functions
└── config.toml         # Supabase configuration

docs/                    # Documentation
tests/                   # Test files
scripts/                 # Build and utility scripts
```

### Component Organization
```typescript
// Component file structure
export interface ComponentProps {
  // Props interface
}

export default function Component({ prop1, prop2 }: ComponentProps) {
  // Component logic
  return (
    // JSX
  );
}
```

### Service Organization
```typescript
// Service file structure
export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export class ServiceName {
  static async methodName(): Promise<ServiceResponse<DataType>> {
    // Service implementation
  }
}
```

---

## Coding Standards

### TypeScript Guidelines

#### Type Definitions
```typescript
// Use interfaces for object shapes
interface User {
  id: string;
  email: string;
  name: string;
}

// Use types for unions and computed types
type UserRole = 'super_admin' | 'tenant_admin' | 'user';
type UserWithRole = User & { role: UserRole };

// Use enums for constants
enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending'
}
```

#### Function Signatures
```typescript
// Always specify return types
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Use async/await for promises
async function fetchUser(id: string): Promise<User | null> {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
}
```

### React Guidelines

#### Component Structure
```typescript
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ComponentProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export default function UserComponent({ userId, onUpdate }: ComponentProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => UserService.getUser(userId),
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Details</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Component content */}
      </CardContent>
    </Card>
  );
}
```

#### Custom Hooks
```typescript
// Custom hook for user management
export function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => UserService.getUser(userId),
    enabled: !!userId,
  });
}

// Custom hook for form management
export function useForm<T>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const setValue = (field: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return { values, errors, setValue, setErrors };
}
```

### Error Handling

#### Service Layer Error Handling
```typescript
export class BaseService {
  protected static handleError(error: any, context: string): ServiceResponse<null> {
    console.error(`Error in ${context}:`, error);
    
    return {
      data: null,
      error: error.message || 'An unexpected error occurred',
      success: false,
    };
  }

  protected static handleSuccess<T>(data: T, message?: string): ServiceResponse<T> {
    return {
      data,
      error: null,
      success: true,
    };
  }
}
```

#### Component Error Handling
```typescript
// Error boundary for components
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Component error:', error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Something went wrong. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}
```

---

## API Development

### Service Architecture
```typescript
// Base service class
export abstract class BaseService {
  protected static async makeRequest<T>(
    request: () => Promise<T>
  ): Promise<ServiceResponse<T>> {
    try {
      const data = await request();
      return this.handleSuccess(data);
    } catch (error) {
      return this.handleError(error, 'API request');
    }
  }
}

// Specific service implementation
export class UserService extends BaseService {
  static async getUser(id: string): Promise<ServiceResponse<User>> {
    return this.makeRequest(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    });
  }
}
```

### API Response Patterns
```typescript
// Consistent response format
interface ApiResponse<T> {
  data: T;
  error: string | null;
  success: boolean;
  timestamp: string;
}

// Pagination support
interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### Database Functions
```sql
-- Example database function
CREATE OR REPLACE FUNCTION get_user_reviews(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  customer_name VARCHAR,
  rating INTEGER,
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.customer_name, r.rating, r.review_text, r.created_at
  FROM reviews r
  WHERE r.tenant_id = get_current_tenant_id()
  ORDER BY r.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Database Development

### Migration Guidelines
```sql
-- Migration file naming: YYYYMMDDHHMMSS_description.sql
-- Example: 20250104120000_add_user_preferences.sql

-- Always include rollback information
-- Up migration
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Down migration (commented)
-- DROP TABLE user_preferences;
```

### RLS Policy Patterns
```sql
-- Standard tenant isolation policy
CREATE POLICY "tenant_isolation" ON table_name
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- Super admin bypass policy
CREATE POLICY "super_admin_access" ON table_name
  FOR ALL USING (is_super_admin(auth.uid()));

-- User-specific policy
CREATE POLICY "user_owns_resource" ON table_name
  FOR ALL USING (user_id = auth.uid());
```

### Indexing Strategy
```sql
-- Performance indexes
CREATE INDEX idx_reviews_tenant_id ON reviews(tenant_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_profiles_tenant_id ON profiles(tenant_id);

-- Composite indexes for common queries
CREATE INDEX idx_reviews_tenant_status ON reviews(tenant_id, status);
CREATE INDEX idx_audit_logs_tenant_action ON audit_logs(tenant_id, action);
```

---

## Testing Guidelines

### Unit Testing
```typescript
// Example unit test
import { describe, it, expect, vi } from 'vitest';
import { UserService } from '@/services/userService';

describe('UserService', () => {
  it('should fetch user successfully', async () => {
    const mockUser = { id: '1', name: 'Test User' };
    vi.spyOn(supabase.from, 'select').mockResolvedValue({
      data: mockUser,
      error: null,
    });

    const result = await UserService.getUser('1');
    
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockUser);
  });
});
```

### Integration Testing
```typescript
// Example integration test
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserDirectory } from '@/components/master-dashboard/users/UserDirectory';

describe('UserDirectory Integration', () => {
  it('should display users list', async () => {
    const queryClient = new QueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <UserDirectory />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('User Directory')).toBeInTheDocument();
    });
  });
});
```

### E2E Testing
```typescript
// Example E2E test with Playwright
import { test, expect } from '@playwright/test';

test('user can login and view dashboard', async ({ page }) => {
  await page.goto('/login');
  
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');
  
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByText('Dashboard')).toBeVisible();
});
```

---

## Deployment Process

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] No linting errors
- [ ] TypeScript compilation successful
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Security audit completed

### Build Process
```bash
# Production build
npm run build

# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm run test:ci
```

### Deployment Steps
```bash
# 1. Build application
npm run build

# 2. Deploy to Supabase
supabase db push --db-url $DATABASE_URL

# 3. Deploy frontend
vercel deploy --prod

# 4. Verify deployment
npm run test:e2e:prod
```

### Environment Management
```bash
# Development
npm run dev

# Staging
npm run build:staging
vercel deploy --target staging

# Production
npm run build:prod
vercel deploy --prod
```

---

## Contributing

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```

### Commit Message Format
```
type(scope): description

feat(auth): add two-factor authentication
fix(dashboard): resolve loading state issue
docs(api): update API documentation
test(user): add user service tests
```

### Pull Request Process
1. **Create feature branch** from `main`
2. **Implement changes** following coding standards
3. **Add tests** for new functionality
4. **Update documentation** if needed
5. **Create pull request** with description
6. **Address review feedback**
7. **Merge after approval**

### Code Review Guidelines
- **Functionality**: Does the code work as intended?
- **Performance**: Are there any performance implications?
- **Security**: Are there any security concerns?
- **Maintainability**: Is the code easy to understand and maintain?
- **Testing**: Are there adequate tests?

---

## Performance Optimization

### Frontend Optimization
```typescript
// Code splitting
const LazyComponent = lazy(() => import('./LazyComponent'));

// Memoization
const MemoizedComponent = memo(({ data }: Props) => {
  return <div>{data.name}</div>;
});

// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';
```

### Database Optimization
```sql
-- Query optimization
EXPLAIN ANALYZE SELECT * FROM reviews 
WHERE tenant_id = $1 AND created_at > $2;

-- Connection pooling
-- Configured in Supabase settings
```

### Caching Strategy
```typescript
// React Query caching
const { data } = useQuery({
  queryKey: ['reviews', tenantId],
  queryFn: () => ReviewService.getReviews(tenantId),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

---

## Security Guidelines

### Input Validation
```typescript
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['user', 'admin']),
});

// Validate input
const validatedData = userSchema.parse(inputData);
```

### SQL Injection Prevention
```typescript
// Always use parameterized queries
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId); // Safe parameter binding
```

### Authentication Security
```typescript
// Verify user permissions
const hasPermission = await checkUserPermission(userId, 'read:users');
if (!hasPermission) {
  throw new Error('Insufficient permissions');
}
```

---

## Monitoring & Debugging

### Logging Strategy
```typescript
import { logger } from '@/utils/logger';

// Structured logging
logger.info('User login', {
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString(),
});

// Error logging
logger.error('Database error', {
  error: error.message,
  stack: error.stack,
  context: 'UserService.getUser',
});
```

### Performance Monitoring
```typescript
// Performance measurement
const startTime = performance.now();
const result = await expensiveOperation();
const endTime = performance.now();

logger.info('Operation completed', {
  duration: endTime - startTime,
  operation: 'expensiveOperation',
});
```

### Error Tracking
```typescript
// Error boundary with tracking
export function ErrorBoundary({ children }: Props) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (error) {
      // Send to error tracking service
      errorTrackingService.captureException(error);
    }
  }, [error]);

  // Error boundary implementation
}
```

---

*For questions or support, contact the development team at dev@crux.com*

*Last Updated: January 4, 2025*
*Version: 1.0.0*
