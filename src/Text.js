import { tint } from './util'

export default Text = {
  // Writes some text and returns a canvas with the text on it.
  //
  // Typically used in combination with ctx.drawImage:
  //   ctx.drawImage(Text.write('Hello World!'), 0, 0)
  write: function(str: string = '', color: string = 'black') {
    let canvas = document.createElement('canvas')
    canvas.width = Math.max(...str.split('\n').map(chars => chars.length)) * 8
    canvas.height = str.split('\n').length * 8
    
    let ctx = canvas.getContext('2d')
    if (!ctx) throw new TypeError('Failed to get new canvas context.')
    
    let img = tint(Text.set, color)
    
    let x = 0, y = 0
    for (let i in str) {
      let char = str[i]
      
      if (char === '\n') {
        x = 0
        y += 8
      } else {
        let [dx, dy] = Text.map[char] || [0, 0]
        
        ctx.drawImage(img, dx * 8, dy * 8 + 1, 8, 8, x, y, 8, 8)
        
        x += 8
      }
    }
    
    return canvas
  },
  
  set: new Image,
  
  map: {
    'A': [0, 0],
    'B': [1, 0],
    'C': [2, 0],
    'D': [3, 0],
    'E': [4, 0],
    'F': [5, 0],
    'G': [6, 0],
    'H': [7, 0],
    'I': [8, 0],
    'J': [9, 0],
    'K': [10, 0],
    'L': [11, 0],
    'M': [12, 0],
    'N': [13, 0],
    'O': [14, 0],
    'P': [15, 0],
    'Q': [16, 0],
    'R': [17, 0],
    'S': [0, 1],
    'T': [1, 1],
    'U': [2, 1],
    'V': [3, 1],
    'W': [4, 1],
    'X': [5, 1],
    'Y': [6, 1],
    'Z': [7, 1],
    
    'a': [8, 1],
    'b': [9, 1],
    'c': [10, 1],
    'd': [11, 1],
    'e': [12, 1],
    'f': [13, 1],
    'g': [14, 1],
    'h': [15, 1],
    'i': [16, 1],
    'j': [17, 1],
    'k': [0, 2],
    'l': [1, 2],
    'm': [2, 2],
    'n': [3, 2],
    'o': [4, 2],
    'p': [5, 2],
    'q': [6, 2],
    'r': [7, 2],
    's': [8, 2],
    't': [9, 2],
    'u': [10, 2],
    'v': [11, 2],
    'w': [12, 2],
    'x': [13, 2],
    'y': [14, 2],
    'z': [15, 2],
    
    '?': [0, 3],
    '!': [1, 3],
    '.': [2, 3],
    "'": [3, 3],
    '(': [4, 3],
    ')': [5, 3],
    '#': [6, 3],
    ' ': [7, 3],
  },
}

Text.set.src = 'sprites/text.png'
