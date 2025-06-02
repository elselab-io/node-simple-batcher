# Migration Guide: @elselab/node-simple-batcher → @elselab-io/node-simple-batcher

This guide helps you migrate from the deprecated `@elselab/node-simple-batcher` to the new `@elselab-io/node-simple-batcher` package.

## 🚨 Important Notice

The `@elselab/node-simple-batcher` package has been **deprecated** and moved to `@elselab-io/node-simple-batcher`. 

## 📦 Quick Migration Steps

### 1. Uninstall the old package

```bash
npm uninstall @elselab/node-simple-batcher
```

### 2. Install the new package

```bash
npm install @elselab-io/node-simple-batcher
```

### 3. Update your imports

**Before:**
```typescript
import { processBatches } from '@elselab/node-simple-batcher';
```

**After:**
```typescript
import { processBatches } from '@elselab-io/node-simple-batcher';
```

### 4. Update package.json dependencies

**Before:**
```json
{
  "dependencies": {
    "@elselab/node-simple-batcher": "^1.0.0"
  }
}
```

**After:**
```json
{
  "dependencies": {
    "@elselab-io/node-simple-batcher": "^1.0.0"
  }
}
```

## 🔄 Automated Migration Script

You can use this script to automatically update your project:

```bash
# Create migration script
cat > migrate-batcher.sh << 'EOF'
#!/bin/bash

echo "🚀 Migrating @elselab/node-simple-batcher to @elselab-io/node-simple-batcher"

# Uninstall old package
echo "📦 Uninstalling old package..."
npm uninstall @elselab/node-simple-batcher

# Install new package
echo "📦 Installing new package..."
npm install @elselab-io/node-simple-batcher

# Update imports in TypeScript/JavaScript files
echo "🔄 Updating imports..."
find . -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" | \
  grep -v node_modules | \
  xargs sed -i.bak "s/@elselab\/node-simple-batcher/@elselab-io\/node-simple-batcher/g"

# Clean up backup files
find . -name "*.bak" -delete

echo "✅ Migration completed!"
echo "📝 Please review your changes and test your application."
EOF

# Make script executable and run
chmod +x migrate-batcher.sh
./migrate-batcher.sh
```

## 🔍 What Changed?

### Package Name
- **Old**: `@elselab/node-simple-batcher`
- **New**: `@elselab-io/node-simple-batcher`

### API Compatibility
✅ **100% API Compatible** - No breaking changes to the API. All functions, classes, and types remain exactly the same.

### Enhanced Features
The new package includes:
- 📚 Enhanced documentation with better examples
- 🎨 Improved README structure with performance benchmarks
- 🏷️ Better npm badges and metadata
- 🔧 Same powerful batch processing capabilities

## 📋 Verification Checklist

After migration, verify everything works:

- [ ] Package installed successfully
- [ ] All imports updated
- [ ] TypeScript types working correctly
- [ ] Tests passing
- [ ] Application runs without errors

## 🆘 Need Help?

If you encounter any issues during migration:

1. **Check the documentation**: [GitHub Repository](https://github.com/elselab-io/node-simple-batcher)
2. **Open an issue**: [Report Issues](https://github.com/elselab-io/node-simple-batcher/issues)
3. **Contact us**: [contact@elselab.io](mailto:contact@elselab.io)

## 📈 Benefits of Migration

- ✅ Continued support and updates
- ✅ Enhanced documentation
- ✅ Better performance optimizations
- ✅ Active maintenance under @elselab-io organization

---

**Thank you for using node-simple-batcher! 🙏**
