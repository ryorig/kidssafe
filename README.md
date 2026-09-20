# KidsSafe

> 日本語のREADMEはこちらです: [README.ja.md](README.ja.md)

KidsSafe is a simple tool to create and share community safety maps. It's designed to be easily updated by editing CSV files, with no complex database or server setup required.

The map is mobile-friendly, built with Leaflet, and can be deployed for free on GitHub Pages.


![KidsSafe user interface showing a map with custom icons, a header with the area name, and a menu button.](https://user-images.githubusercontent.com/155338/235282459-71701331-5079-408c-80a5-f938032738d2.png)


## Demo

- [Echizen City Kunitaka Area](https://code4fukui.github.io/kunitaka)
- [Fukui City Natsume Area](https://code4fukui.github.io/kidssafe-natsume)
- [Echizen City Okamoto Area](https://code4fukui.github.io/kidssafe-okamoto)

## Features

- **Interactive Maps:** Display safety locations with custom icons on a mobile-friendly map.
- **CSV-Powered:** Manage all map data using simple CSV files, editable in Excel, Numbers, or any text editor.
- **Layered Data:** Organize points of interest into distinct layers (e.g., "AED Locations," "110番の家").
- **Easy Deployment:** Publish your map for free using GitHub Pages.
- **Simple Sharing:** A QR code is automatically generated in the menu for easy sharing.
- **Mobile-first controls:** Switch safety layers and find your location with thumb-friendly controls.
- **Child safety points:** Add locally verified risks such as traffic, poor visibility, dark roads, water hazards, and sudden crossings.

## How It Works

The map is built from a two-tiered CSV structure:

1.  **`data/layers.csv`:** This is the main configuration file. It defines the *layers* that will appear on the map, linking each layer name to a data file and an icon.
2.  **CSV files in `data/locations/`:** These files contain the actual location data for each layer, including coordinates (`lat`/`lng` or `Geo3x3`) and other details.

## Usage

1.  **Create Repository:** Create a new repository from the [kidssafe-template](https://github.com/code4fukui/kidssafe-template/). Name it `kidssafe-` followed by your area name.
2.  **Customize Settings:**
    -   In `index.html`, update the `city`, `area`, and `githublink` values.
3.  **Define Layers & Data:**
    -   Edit `data/layers.csv` to define your map layers.
    -   Create or update the corresponding CSV files in `data/locations/` with your location data.
4.  **Deploy:**
    -   In your new repository, go to `Settings` > `Pages`.
    -   Under `Build and deployment`, select `GitHub Actions` as the source. This will publish your map automatically.

For more details on updating data, refer to the [kidssafe-template](https://github.com/code4fukui/kidssafe-template/) documentation.

## Data Format

### `data/layers.csv` (Layer Configuration)

This file defines the layers available on the map.

| name | fn | icon | marker |
| :--- | :--- | :--- | :--- |
| Layer Display Name | Data Filename | Icon Filename | Optional text marker |

**Example:**
```csv
name,fn,icon
110番の家,./data/locations/house110.csv,house110_icon.png
AED,./data/locations/aed.csv,aed.png
交通事故発生箇所,./data/locations/accident.csv,aioi_8.png
```

### Location Data CSV (e.g., `data/locations/house110.csv`)

These files contain the points for a specific layer. Each row is a point on the map. You must include coordinate columns (`lat` and `lng`, or `Geo3x3`). All other columns will be displayed in the popup info box.

**Example:**
```csv
name,address,lat,lng
"こども110番の家（田中商店）","福井県鯖江市新横江1-1-1",35.943,136.188
"こども110番の家（鈴木理容所）","福井県鯖江市桜町2-2-2",35.945,136.189
```

## Development

To run a local development server, you need [Deno](https://deno.land/).

```sh
# Serve the project directory locally
deno run -A --watch --allow-net --allow-read https://deno.land/std/http/file_server.ts
```

## Attribution

- Map tiles by [Geospatial Information Authority of Japan](https://maps.gsi.go.jp/development/ichiran.html).

## License

[MIT](LICENSE)
