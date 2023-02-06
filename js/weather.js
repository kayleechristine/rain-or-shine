"use strict";

// Days of the Week
let weekday = [
    {id: 0, name: 'Sunday'},
    {id: 1, name: 'Monday'},
    {id: 2, name: 'Tuesday'},
    {id: 3, name: 'Wednesday'},
    {id: 4, name: 'Thursday'},
    {id: 5, name: 'Friday'},
    {id: 6, name: 'Saturday'}
];

// Title Case Function
function titleCase(str) {
    let splitStr = str.toLowerCase().split(' ');
    for (let i = 0; i < splitStr.length; i++) {
        splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
    }
    return splitStr.join(' ');
}

// Populates the Weather Cards
function updateWeather(lat, lon) {

    // Current Day Weather
    $.get("http://api.openweathermap.org/data/2.5/weather", {
        APPID: OPEN_WEATHER_APPID,
        lat: lat,
        lon: lon,
        units: "imperial"
    }).done(function (data) {
        // console.log('Current Weather', data);

        // Day of the Week
        let date = new Date(data.dt * 1000); // Local Time
        let day = weekday[date.getDay()].name; // Day of the Week

        // Details
        let {temp_min, temp_max, humidity, pressure} = data.main; // Temps, Humidity & Pressure
        let {description} = data.weather[0]; // Wx Description
        let img = description.replace(' ', '-'); // Image
        let {speed} = data.wind; // Wind Speed

        // Pushes to the Card
        $('#location').html(data.name);
        $('#img-now').html(`<img src="img/wx/${img}.png" class="rounded-start">`);
        $('#img-1').html(`<img src="img/wx/${img}.png" class="card-img-top">`);
        $('#day-1').html(day);
        $('#low-1, #low').html(Math.round(temp_min) + '°F');
        $('#high-1, #high').html(Math.round(temp_max) + '°F');
        $('#wx-1, #wx').html(titleCase(description));
        $('#humid-1, #humid').html(humidity);
        $('#wind-1, #wind').html(speed);
        $('#press-1, #press').html(pressure);
    });

    // 5-day Forecast
    $.get("http://api.openweathermap.org/data/2.5/forecast", {
        APPID: OPEN_WEATHER_APPID,
        lat: lat,
        lon: lon,
        units: "imperial",
    }).done(function (data) {
        console.log('5 Day Forecast', data);

        // Convert UTC time to Local Time
        let date = new Date(data.list[0].dt * 1000);
        let hours = date.getHours();

        // Find the Next Day
        let offset = date.getTimezoneOffset() / 60; // # hours difference from local to UTC time
        // console.log('offset:', offset, 'hours:', hours);
        let index = (((24 - offset) - hours) / 3) + 3; // Index of the next day's first weather report
        // console.log(index); // TODO: Test

        // Days Two - Five
        for (let i = 2; i <= 5; i++) {

            // Day of the Week
            let num = new Date(data.list[(index + 1)].dt * 1000); // Local Time
            let day = weekday[num.getDay()].name; // Day of the Week

            // Calculating Daily Averages
            let max = index + 8;
            let tempData = [], pressureData = [], humidityData = [], windData = [];

            for (let i = index; i < max; i++) {
                tempData.push(data.list[i].main.temp);
                pressureData.push(data.list[i].main.pressure);
                humidityData.push(data.list[i].main.humidity);
                windData.push(data.list[i].wind.speed);
            }
            function findAverage(arr) {
                return arr.filter(num => num >= 0).reduce((sum, add) => sum + add, 0) / 8;
            }

            // Details
            let {description} = data.list[index].weather[0]; // Wx Description
            let img = description.replace(' ', '-'); // Image
            let humidity = findAverage(humidityData); // Humidity
            let wind = findAverage(windData); // Wind Speed
            let pressure = findAverage(pressureData); // Pressure

            // Pushes to the Card
            $(`#img-${i}`).html(`<img src="img/wx/${img}.png" class="card-img-top">`);
            $(`#day-${i}`).html(day);
            $(`#low-${i}`).html(Math.round(Math.min(...tempData)) + '°F');
            $(`#high-${i}`).html(Math.round(Math.max(...tempData)) + '°F');
            $(`#wx-${i}`).html(titleCase(description));
            $(`#humid-${i}`).html(Math.round(humidity));
            $(`#wind-${i}`).html(wind.toFixed(2));
            $(`#press-${i}`).html(Math.round(pressure));

            index += 8; // Weather updates in 3-hr increments, with 8/day
        }
    });
}

// Loads Dallas Weather by Default
window.addEventListener("load", (event) => {
    marker.setLngLat([-96.799668, 32.780834]).addTo(map);
    updateWeather(32.780834, -96.799668);
});

// Creates the Map
mapboxgl.accessToken = MAPBOX_TOKEN;
const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v9', // style URL
    zoom: 10, // starting zoom
    center: [-96.799668, 32.780834] // Dallas, TX
});
// console.log('Mapbox:', map);

// Search Box Feature
const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    marker: null,
    mapboxgl: mapboxgl
})

document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

// Draggable Marker
const marker = new mapboxgl.Marker({
    color: '#fcba13',
    draggable: true
})

function onDragEnd() {
    const lngLat = marker.getLngLat();
    updateWeather(lngLat.lat, lngLat.lng);
}
marker.on('dragend', onDragEnd);

// Update Weather by Location
$('.mapboxgl-ctrl-geocoder--input').change(function() {

    let location = $(this).val();

    $.get("http://api.openweathermap.org/geo/1.0/direct", {
        APPID: OPEN_WEATHER_APPID,
        q: location
    }).done(function(data) {

        let {lat, lon} = data[0];
        updateWeather(lat, lon);
        marker.setLngLat([lon, lat]).addTo(map);
    })
});

// Bootstrap Tooltips
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

// Forecast Slider Animation
$('.trigger, .slider').click(function() {
    $('.slider').toggleClass('close');
});