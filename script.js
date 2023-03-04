'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];



class workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);
    clicks = 0;
    constructor(coords, distance, duration) {
        this.coords = coords;      //[lat, lng]
        this.distance = distance;  // in km
        this.duration = duration;  // in min
    }
    _setDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]}
        ${this.date.getDate()}
        `;
    }

    click() {
        this.clicks++;
    }
}

class Running extends workout {
    type = 'running';
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }
    calcPace() {
        /// min/km
        this.pace = this.duration / this.distance;
        return this.pace;
    }


}
class Cycling extends workout {
    type = 'cycling';
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }
    calcSpeed() {
        /// km/h
        this.speed = this.distance / (this.duration / 60);
        this.speed;
    }
}

//////////////////App Arctechture/////////////
/////////////////////////////////////////////
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
    #map;
    #mapZoomLevel = 13;
    #mapEvent;
    #workouts = [];
    constructor() {
        this._getPosition();
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggelElvationField.bind(this));
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
        this._getLocalStorage();

    }
    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () => {
                alert(`Could get your postion`);
            })
        }
    }

    _loadMap(postion) {
        const latitude = postion.coords.latitude; //30
        const longitude = postion.coords.longitude;

        ///////use leaflit library to display map 
        const pos = [latitude, longitude];
        this.#map = L.map('map').setView(pos, this.#mapZoomLevel);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        this.#map.on('click', this._showForm.bind(this));
        this.#workouts.forEach((work) => this._renderWorkoutMarker(work));
    }

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _hideForm() {
        //Hide the form + Clear fields
        inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = '';
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => form.style.display = 'grid', 1000);

    }


    _toggelElvationField() {
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    }


    _newWorkout(e) {
        const validInputs = (...inputs) => inputs.every(val => Number.isFinite(val));
        const allPositive = (...inputs) => inputs.every(num => num > 0);
        e.preventDefault();

        //Get data from form 
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;


        let workout;

        //if workout is running, create an running workout object
        if (type === 'running') {
            const cadence = +inputCadence.value;
            //check if the data is valid 
            if (!validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence)) {
                return alert('please enter positive numbers');
            }
            workout = new Running([lat, lng], distance, duration, cadence);
        }

        //if workout is cycling, create an cycling workout object
        if (type === 'cycling') {
            const elevation = +inputElevation.value;

            //check if the data is valid 
            if (!validInputs(distance, duration, elevation) || !allPositive(distance, duration)) {
                return alert('please enter positive numbers');
            }

            workout = new Cycling([lat, lng], distance, duration, elevation);

        }


        //add this new object to workout array 
        this.#workouts.push(workout);


        //Display this object in the map as marker
        this._renderWorkoutMarker(workout);

        //Render worout in the list
        this._renderWorkout(workout);

        //Hide the form + Clear fields
        this._hideForm();

        //Set local storage to all workouts
        this._setLocalStorage();
    }


    _renderWorkoutMarker(workout) {
        L.marker(workout.coords).addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`
            })
            )
            .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
            .openPopup();

    }

    _renderWorkout(workout) {
        let html =
            `<li class="workout workout--${workout.type}" data-id="${workout.id}">
                <h2 class="workout__title">${workout.description}</h2>
                <div class="workout__details">
                    <span class="workout__icon"> ${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
                    <span class="workout__value">${workout.distance}</span>
                    <span class="workout__unit">km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⏱</span>
                    <span class="workout__value">${workout.duration}</span>
                    <span class="workout__unit">min</span>
                </div>
        `

        if (workout.type === 'running') {
            html +=
                `<div class="workout__details">
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
            html +=
                `<div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.speed.toFixed(1)}</span>
                    <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⛰</span>
                    <span class="workout__value">${workout.elevationGain}</span>
                    <span class="workout__unit">m</span>
                </div>
            </li> -->
            `;
        }
        // console.log(html);
        form.insertAdjacentHTML('afterend', html);
    }

    _moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');
        if (!workoutEl) return;

        const workout = this.#workouts.find((workout) => workout.id === workoutEl.dataset.id);

        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1,
            }
        });
        // workout.click();
        // console.log(workout)

    }
    _setLocalStorage() {
        localStorage.setItem('workout', JSON.stringify(this.#workouts));
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workout'));
        if (!data) return;
        this.#workouts = data;
        this.#workouts.forEach((work) => this._renderWorkout(work));
    }

    _reset() {
        localStorage.removeItem('workout');
        location.reload();
    }
}
////////use geolocation to get the current position



const app = new App();
document.addEventListener('keypress', function (e) {
    console.log(e.target);
});

