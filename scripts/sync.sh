#!/bin/sh
# Copies the shared pricing engine into the api function.
cp "$(dirname "$0")/../src/lib/pricing.ts" "$(dirname "$0")/../supabase/functions/api/pricing.ts"
