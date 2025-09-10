var gameFont = new FontFace('gameFont', 'url("/static/fonts/gameFont.ttf")')
gameFont.load().then(function(loadedFace) {
    document.fonts.add(loadedFace);
}).catch(function(error) {})
