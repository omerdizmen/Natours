import '@babel/polyfill'
import { displayMap } from './mapbox';
import { login, logout } from "./login";
import { updateData } from './updateSettings';

const mapBox = document.getElementById("map");
const loginForm = document.querySelector(".form");
const logOutBtn = document.querySelector(".nav__el--logout");
const userDataForm = document.querySelector(".form-user-data");

if(mapBox){
    const locations = JSON.parse(document.getElementById("map").dataset.locations);
    displayMap(locations);
}

if(loginForm){
    loginForm.addEventListener("submit", function(e){
        e.preventDefault();
    
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
    
        login(email, password)
    });

}

if(logOutBtn){
    logOutBtn.addEventListener("click",logout);
}

if(userDataForm){
    userDataForm.addEventListener("submit", e => {
        e.preventDefault();

        const name = userDataForm.getElementById("name");
        const email = userDataForm.getElementById("email");
        updateData(name, email);
    });
}