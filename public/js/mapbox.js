export const displayMap = (locations) => {
    mapboxgl.accessToken = 'pk.eyJ1IjoieWVybWVtIiwiYSI6ImNseGx1MG4zcjAxZDkybHNidWdyMTk1amIifQ.lfvZjbGdlKheWJRuWedK3A';
    let map = new mapboxgl.Map({ container: 'map',style: 'mapbox://styles/yermem/clxlzu2t200gv01qr1zi686a0'
        ,center: [-118.113, 34.11], 
        zoom: 8,
        // interactive: false,
        scrollZoom: false

    });

    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach(locations => {
        const el = document.createElement("div");
        el.className = "marker";

        new mapboxgl.Marker({
            element: el,
            anchor: "bottom"
        }).setLngLat(locations.coordinates).addTo(map);

        const popupOptions = {offset: 30}
        new mapboxgl.Popup(popupOptions).setLngLat(locations.coordinates)
        .setHTML(`<p>Day ${locations.day}: ${locations.description}</p>`)
        .addTo(map);

        bounds.extend(locations.coordinates);
    });

    map.fitBounds(bounds, {
        padding:{
            top: 200,
            left: 100,
            bottom: 200,
            right: 100
        }
    });  
}

