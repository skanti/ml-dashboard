class ColorPalette {
  constructor() {
    this.palette = [
      //darkslategray
      '#2f4f4f',
      // mint
      "#AAF0D1",
      //darkred
      '#8b0000',
      //olive
      '#808000',
      //darkorange
      '#ff8c00',
      //red
      '#ff0000',
      //deepskyblue
      '#00bfff',
      // peach
      "#FFE5B4",
      //blue
      '#0000ff',
      //fuchsia
      '#ff00ff',
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
