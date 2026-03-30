SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

for dir in "$ROOT_DIR/test/e2e_apps"/*/; do
  if [ -f "$dir/package.json" ]; then
    echo "Processing $dir"
    (
      cd "$dir" || exit
      npm i
      npm update
      npm audit fix
    )
  fi
done
