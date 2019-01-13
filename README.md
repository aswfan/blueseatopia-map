# Blueseatopia
 
This website is developed by [Angular CLI](https://github.com/angular/angular-cli) to view photos on a map. this project is written in Typescript and its main purpose is to show how to use [ArcGIS API for JavaScript](https://developers.arcgis.com/javascript/)(version *4.x*) to visualize data(including photo) on a map. 

![Overview 3D](https://github.com/aswfan/blueseatopia-map/raw/master/image/Overview3D.png)

![View Photo on Map](https://github.com/aswfan/blueseatopia-map/raw/master/image/PhotoInDisplay.png)

### Backstory

This idea comes from one of IOS's features, which right now is only avaible on Apple's devices(e.g. iPhone, and iPad) but not in web(e.g. iCloud). So, currently the only way in the web for this kind of use is to create a custom map through Google MyMaps, which is said by some people to be "the best". Well, it's "partially" correct. It's fine for personal use with insensitive information(e.g. photos and location), which doesn't require large amount of resource as well. But for some oragnizations(non-profit or for-profit), especially those who have competing business with Google, the requiremnt is extremely high for services' performance, let alone sharing their data with others. In this situation, [ArcGIS](https://www.arcgis.com/index.html), as an important alternative, provide a solution for visualization on map.

### Why ArcGIS API 4.x: Comparing between 3.x and 4.x

The reason to use 4.x...

For details, refer to [link](https://developers.arcgis.com/javascript/latest/guide/choose-version/index.html).

### Release Note:

#### Phase 1: 2019/01/07 - 2019/01/12 (done):
1. Build up the map
2. Highlight regions with photos to be display
3. Pin pictures to the location
4. Switch between 3D map and 2D while zoom in/out
5. Setup simple structure of the site with Angular 2 and Bootstrap

### Futrue Plan:
1. Enable photo cluster (currently not support by ArcGIS 4.10)'
2. Dynamically load and visualize data (locations and pitucres) from remote
3. Enable photo upload and location detection
4. Add address search and routing plan (/navigation)