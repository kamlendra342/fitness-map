'use strict';
// we are using leaflet for the map 
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

//////////////////////////////////////////////////////////////////////////

class Workout{
    date = new Date();
    id = (Date.now()+ '').slice(-10); // creating id

    constructor(coords,distance,duration) {
        this.coords = coords;//         [lat,lng]
        this.duration = duration; // in min
        this.distance = distance; // in km
    }
    _setDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]}${this.date.getDate()}`;
    }
}


////////////////////
class Running extends Workout{
    constructor(coords,distance,duration,cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcpace();
        this.type = 'running';
        this._setDescription();
    }
    calcpace() {
        //km/min
        this.pace = this.distance / this.duration;
        return this.pace
    }
}
////////////////////
class Cycling extends Workout{
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.type = 'cycling';
        this.elevationGain = elevationGain;
        this._setDescription();
        this.calcspeed();
    }
    calcspeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed
    }
}



//-----------------------------------------------------------------------
class App{
    #mapZoomlevel=13;
    #map;
    #mapEvent;
    #workouts = [];
    constructor() {
        // this.workouts = [];
        this._getPosition();
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener('click', this._movetopopup.bind(this));
        //get data from ocal storage
        this._getLocalStorage();
    }
//////////////////////////////////////////
    _getPosition() {
        // if (navigator.geolocation)
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
            alert('cant get location')}); 
    }
/////////////////////////////////////////
    _loadMap(position) {
            const { latitude } = position.coords;
            const {longitude} = position.coords;
        const coords = [latitude, longitude]
            this.#map = L.map('map').setView(coords, this.#mapZoomlevel);
            L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.#map);
            // showing your current location
            L.marker(coords).addTo(this.#map);
            // handling click on map 
        this.#map.on('click', this._showForm.bind(this));
        // here we are marking the location from data of local storage we have to do this function hee due to aschyncronos nature 
        this.#workouts.forEach(work=>{
            this._renderWorkoutMarker(work)
        })
    }
//////////////////////////////////////////////
    _showForm(mapE) {
        // console.log(mapE)
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }
/////////////////////////////////////////////
    _hideForm() {
        // empty the form 
        inputDistance.value = inputDuration.value = inputElevation.value = inputCadence.value = "";
        // hiding the form
        form.classList.add('hidden');  
    }
////////////////////////////////////////////
    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');    
    }
///////////////////////////////////////////
    _newWorkout(e) {
        e.preventDefault();
        // get data from form 
        const type = inputType.value;
        const distance = inputDistance.value;
        const duration = inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;
        // validity cheq
        const val = (...inputs) => inputs.every(el => Number(el));
        const val1 = (...inputs) => inputs.every(el => el > 0);
        
        ///////////////////////////////////
            // If workout running, create running object
        if (type === 'running') {
            const cadence = +inputCadence.value;
            // Check if data is valid
            if (val(distance, duration, cadence) && val1(distance, duration, cadence)) {
                workout = new Running([lat, lng], distance, duration, cadence);

            } else {
                return alert('Inputs have to be positive numbers!');
            };
        };
        //////////////////////////
        if (type === 'cycling') {
            const elevation = +inputElevation.value;
            // Check if data is valid
            if (val(distance, duration, elevation) && val1(distance, duration, elevation)) {
                workout = new Cycling([lat, lng], distance, duration, elevation);

            } else {
                return alert('Inputs have to be positive numbers!');
            };
        };
        // add new object to workout array
        this.#workouts.push(workout);


        console.log(this.#workouts)

        // render  workout on map as marker
        this._renderWorkoutMarker(workout);


        // render workout on lists
        this._renderWorkout(workout);

        // hide the form call
        this._hideForm()
        //set local storange
        this._setLocalStorage()

    }
///////////////////////////////////////////
    _renderWorkoutMarker(workout) {
        L.marker(workout.coords).addTo(this.#map).bindPopup(L.popup({
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: `${workout.type}-popup`,
        maxWidth: 250,
        })).setPopupContent(`${workout.type === 'running' ? '🏃‍♂️🏃‍♂️' : '🚴‍♀️🚴‍♀️'}${workout.description}`).openPopup();  
    }
////////////////////////////////////////////
    _renderWorkout(workout) {
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
        `;

        if (workout.type === 'running') {
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.pace.toFixed(1)}</span>
                    <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">🦶🏼</span>
                    <span class="workout__value">${workout.cadence}</span>
                    <span class="workout__unit">spm</span>
                </div>
            </li>`;
        }
        if (workout.type === 'cycling') {

            html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed}</span>
                <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⛰</span>
                <span class="workout__value">${workout.elevationGain}</span>
                <span class="workout__unit">m</span>
            </div>
            </li>`;
        }
        form.insertAdjacentHTML('afterend',html)
    }
///////////////////////////////////////////////
    _movetopopup(e) {
        const workoutEl = e.target.closest('.workout');
        if (!workoutEl) return "";// to deal with error of clicking of non element

        const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);
        // move to the map
        this.#map.setView(workout.coords, this.#mapZoomlevel, {
            animate: true,
            pan: {
                duration:1,
            }
        })
        
    }
/////////////////////////////////////////////
    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts)); 
    }
/////////////////////////////////////////////
    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));
        if (!data) return;

        this.#workouts = data;
        this.#workouts.forEach(work=>{
            this._renderWorkout(work)
        })
    }
}


// all this function will start after calling this
const app = new App();



