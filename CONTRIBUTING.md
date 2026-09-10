# Contributing to HRI

Thank you for your interest in contributing to HRI!

---

## Getting Started

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/studio-2.git
   cd studio-2
   ```

3. **Set up development environment**:
   ```bash
   npm install
   cp env.local.template .env.local
   npm run db:push
   npm run db:seed
   ```

4. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```

---

## Development Guidelines

### Code Style
- Follow TypeScript best practices
- Use functional components with hooks
- Keep components focused and reusable
- Add comments for complex logic

### Testing
- Write tests for new features
- Test edge cases and error scenarios

### Documentation
- Update README for user-facing changes
- Update API docs for endpoint changes
- Add JSDoc comments for complex functions

---

## Commit Messages

Use conventional commit format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Build process changes

---

## Pull Request Process

1. Ensure all CI checks pass
2. Update documentation
3. Request review from maintainers
4. Provide clear description of changes

---

## Reporting Issues

Please include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots/logs if applicable
