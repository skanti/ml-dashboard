class ColorPalette {
  constructor() {
    this.palette = [
      // dark green
      '#033500',
      //darkred
      '#2f4f4f',
      //olive
      '#8b0000',
      //darkorange
      '#808000',
      //red
      '#ff8c00',
      //deepskyblue
      '#ff0000',
      //blue
      '#00bfff',
      //fuchsia
      '#0000ff',
      //mediumslateblue
      '#ff1493',
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
