export class Symbol {
    public static readonly defaultSymbol = {
        type: "simple-fill",
        style: "solid",
        color: [95, 155, 200, 0],
        outline: {
          color: [239, 239, 239, 1],
          width: 0
        }
      };

    public static readonly displaySymbol = {
      type: "simple-fill",
      style: "solid",
      color: [95, 155, 200, 0.5],
      outline: {
        color: [255, 255, 255, 1],
        width: 0.1
      }
    };

    public static readonly htSymbol = {
      type: "simple-fill",
      style: "solid",
      color: [95, 155, 200, 1],
      outline: {
        color: [255, 255, 255, 1],
        width: 3
      }
    }; 

    public static readonly pointSymbol = {
      type: "simple-marker",
      size: 10,
      color: [0, 255, 255],
      outline: null
    };

    public static readonly htPointSymbol = {
      type: "simple-marker",
      size: 20,
      color: [0, 255, 255],
      outline: {
        color: [255, 255, 255, 1],
        width: 3
      }
    };

    public static readonly pictureSymbol = {
      type: "picture-marker",  // autocasts as new PictureMarkerSymbol()
      url: "https://raw.githubusercontent.com/aswfan/blueseatopia-map/master/src/assets/image/seattle-test.png",
      width: "50px",
      height: "30px",
      outline: {
        color: [255, 255, 255, 1],
        width: 10
      }
    };

    public static readonly htPictureSymbol = {
      type: "picture-marker",  // autocasts as new PictureMarkerSymbol()
      url: "https://raw.githubusercontent.com/aswfan/blueseatopia-map/master/src/assets/image/seattle-test.png",
      width: "128px",
      height: "79px",
      outline: {
        color: [255, 255, 255, 1],
        width: 20
      }
    };
}
