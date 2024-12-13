class ColorPalette {
  constructor() {
    this.palette = [
      "#E799A3", // pink
      "#AAF0D1", // mint
      "#D462FF", // purple
      '#808000', //olive
      '#ff8c00', //darkorange
      '#ff0000', //red
      '#00bfff', //deepskyblue
      "#FFE5B4", // peach
      "#C35817", // brown
      '#0000ff', //blue
      '#ff00ff', //fuchsia
      '#7b68ee', //mediumslateblue
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
