#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Tenta abrir no Chrome em modo app (janela nativa) se existir no Mac
if [ -d "/Applications/Google Chrome.app" ]; then
    open -na "Google Chrome" --args --app="file://$DIR/index.html"
else
    open "$DIR/index.html"
fi
exit 0
