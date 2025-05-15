---
trigger: always_on
---

# Angular Code Style Guidelines

## Project Structure and Architecture

### Atomic Design Principles
- **General**:
  - Aim for around 90% presentational components and around 10% smart components
  - Business logic, state, and data fetching should be handled by services
  - Use Storybook for component documentation and testing, generate thorough stories for each component and organized by atomic structure

- **Atoms**: Basic building blocks (buttons, inputs, labels)
  - Keep components pure and stateless
  - One component per file
  - Use `input signals` and `output signals` for component communication
  - Use `@Input()` and `@Output()` as a fallback for component communication only if `input and output signals` do not work well

- **Molecules**: Groups of atoms (form fields, search bars)
  - Combine multiple atoms to create meaningful UI elements
  - Maintain single responsibility principle

- **Organisms**: Complex UI components (headers, forms)
  - Should be composed of molecules and atoms
  - Handle component-specific business logic

- **Templates**: Page layouts
  - Use Angular Material's grid system and flex box scss for responsive layouts

- **Pages**: Complete interfaces
  - Manage state through services
  - Handle data fetching and error states

## Angular Material Usage

### Component Guidelines
- Use Material Design components as the foundation for UI elements
- Maintain consistent theming using Material's theming system
- Follow Material Design spacing guidelines (8px grid system)
- Implement responsive layouts using Material's Flex Layout

### Styling Rules
- Use SCSS for custom styling
- Create theme variables for colors, typography, and spacing
- Implement dark/light theme support
- Use Material's elevation system for shadows and depth

## Testing Standards

### Test Pyramid

- **Test Pyramid**:
    - Unit Tests: 60%
    - Integration Tests: 15%
    - Component Tests: 15%
    - E2E Tests: 10%

### Unit Tests  
- **File Naming**: `*.spec.ts`
- **Coverage Requirements**: Minimum 80% coverage
- **Test Cases**:
  - Positive case: Expected behavior with valid inputs
  - Negative case: Error handling with invalid inputs
  - Edge cases: Boundary conditions, empty states, large datasets

```typescript
describe('ComponentName', () => {
  // Positive case
  it('should perform expected action with valid input', () => {
    // Arrange
    // Act
    // Assert
  });

  // Negative case
  it('should handle invalid input gracefully', () => {
    // Arrange
    // Act
    // Assert
  });

  // Edge case
  it('should handle boundary conditions', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

### Component Tests
- Use Cypress Component Tests
- Test component rendering
- Verify component interactions
- Test input/output bindings
- Validate template bindings

### Integration Tests
- Test component interactions and data contracts of API's and 3rd party libraries/API's
- Verify service integration
- Test routing and navigation
- Validate data flow

### End to End Tests
- Use Cypress E2E Tests
- Test user flows and transactions (user logs in and ends up at dashboard or selecting a playlist takes them to the playlist page with its information and media player)
- Follow Cypress best practices for end to end testing and keep these tests separate from the component tests

## Code Quality Standards

### TypeScript Guidelines
- Use strict type checking
- Implement interfaces for data models
- Implement types for more complex data models and class functions
- Use enums for fixed values
- Avoid `any` type

### Component Guidelines
- Use OnPush change detection when possible
- Implement lifecycle hooks properly
- Clean up subscriptions in ngOnDestroy
- Use async pipe for observables

### Service Guidelines
- Follow singleton pattern for global services
- Use dependency injection
- Implement proper error handling
- Use TypeScript generics for reusable services and utilize service interfaces where appropriate (Inversion of Control)

### State Management
- Use services for simple state
- Implement proper error handling
- Use Signals for reactive state
- Consider NgRx for complex state management when it becomes complex or difficult in feature or root services

### Performance Guidelines
- Lazy load modules
- Implement proper caching strategies
- Use trackBy for ngFor loops
- Optimize change detection

### Security Guidelines
- Implement proper authentication and authorization
- Use Angular's built-in security features
- Implement proper input validation

### Documentation Guidelines
- Utilize JSDoc and Compodoc for documentation and doc generation
- Document API's and 3rd party libraries/API's
- Document business logic
- Document data models
- Document state management
- Document performance optimization
- Document security measures

### Angular Guidelines
- Use Angular's built-in features and best practices
- Use Angular 19+ control flow syntax in templates to simplify components (@for, @if, @empty, @defer, @loading)
- Use Angular 19+ signals for reactive state
