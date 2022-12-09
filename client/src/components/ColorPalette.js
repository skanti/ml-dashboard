class ColorPalette {
  constructor() {
    this.palette = [
      //darkslategray
      '#2f4f4f',
      //darkred
      '#8b0000',
      //olive
      '#808000',
      //purple
      '#800080',
      //darkorange
      '#ff8c00',
      //mediumspringgreen
      '#00fa9a',
      //red
      '#ff0000',
      //deepskyblue
      '#00bfff',
      //blue
      '#0000ff',
      //fuchsia
      '#ff00ff',
      //khaki
      '#f0e68c',
      //plum
      '#dda0dd',
      //deeppink
      '#ff1493',
      //mediumslateblue
      '#7b68ee',
    ];

    this.num_max = this.palette.length;
    this.counter = 0;
  }

  reset() {
    this.counter = 0;
  }

  get() {
    this.counter = (this.counter + 1)%this.num_max;
    let color = this.palette[this.counter];
    return color;
  }
}

export default ColorPalette;
