#!/bin/bash
# Setup Git hooks for the project
# Run this once after cloning the repository

echo "🔧 Setting up Git hooks..."

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Install pre-push hook
echo "Installing pre-push hook..."
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash
# Git pre-push hook to validate staging deployments
# This runs automatically before every git push

# Get the remote name and URL
remote="$1"
url="$2"

# Get current branch
current_branch=$(git branch --show-current)

# Only run validation when pushing to staging branch
if [ "$current_branch" = "staging" ]; then
    echo "🚀 Detected push to staging branch - running validation..."
    echo ""

    # Run validation script
    if [ -f "scripts/validate-staging-deployment.sh" ]; then
        SKIP_BUILD_TEST=true bash scripts/validate-staging-deployment.sh

        # Check exit code
        if [ $? -ne 0 ]; then
            echo ""
            echo "❌ Pre-push validation failed!"
            echo "Fix the errors above or use 'git push --no-verify' to skip validation"
            exit 1
        fi
    else
        echo "⚠️  Validation script not found - skipping checks"
    fi

    echo ""
    echo "✅ Validation passed! Proceeding with push..."
    echo ""
fi

exit 0
EOF

# Make hook executable
chmod +x .git/hooks/pre-push

echo "✅ Git hooks installed successfully!"
echo ""
echo "The pre-push hook will automatically validate deployments to staging."
echo "To bypass validation (not recommended), use: git push --no-verify"
